import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export interface ItemPrioritas {
  id: string;
  satuanId?: string;
  satuanNama?: string;
  kategori: string;
  namaAlat: string;
  standar: number;
  tergelar: number;
  baik: number;
  rusak: number;
  defisit: number;
  surplus: number;
  kebutuhanPengadaan: number;
  persentasePemenuhan: number;
  persentaseKesiapan: number;
  tingkatPrioritas: "TINGGI" | "SEDANG" | "RENDAH" | "TERPENUHI";
  alasanPrioritas: string;
}

export interface PrioritasResult {
  summary: {
    totalItem: number;
    totalStandar: number;
    totalTergelar: number;
    totalDefisit: number;
    totalRusak: number;
    totalKebutuhanPengadaan: number;
    prioritasTinggiCount: number;
    prioritasSedangCount: number;
    prioritasRendahCount: number;
    terpenuhiCount: number;
  };
  items: ItemPrioritas[];
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const satuanId = searchParams.get("satuanId");

    const filters = satuanId ? { satuanId } : {};

    const [standarList, inventarisList, satuanRecord] = await Promise.all([
      prisma.masterStandarAlat.findMany({
        where: filters,
        include: { satuan: true },
      }),
      prisma.inventarisTergelar.findMany({
        where: filters,
        include: { satuan: true },
      }),
      satuanId ? prisma.satuan.findUnique({ where: { id: satuanId } }) : null,
    ]);

    // Map by key: if satuanId is specified, group by namaAlat; if all satuan, also group by namaAlat (or include category)
    interface AggregatedItem {
      id: string;
      satuanId?: string;
      satuanNama?: string;
      kategori: string;
      namaAlat: string;
      standar: number;
      tergelar: number;
      baik: number;
      rusak: number;
    }

    const map = new Map<string, AggregatedItem>();

    for (const s of standarList) {
      const key = satuanId ? s.namaAlat : `${s.kategori}___${s.namaAlat}`;
      if (!map.has(key)) {
        map.set(key, {
          id: s.id,
          satuanId: s.satuanId,
          satuanNama: s.satuan.nama,
          kategori: s.kategori,
          namaAlat: s.namaAlat,
          standar: s.jumlahWajib,
          tergelar: 0,
          baik: 0,
          rusak: 0,
        });
      } else {
        map.get(key)!.standar += s.jumlahWajib;
      }
    }

    for (const inv of inventarisList) {
      const key = satuanId ? inv.namaAlat : `${inv.kategori}___${inv.namaAlat}`;
      let item = map.get(key);
      if (!item) {
        item = {
          id: inv.id,
          satuanId: inv.satuanId,
          satuanNama: inv.satuan.nama,
          kategori: inv.kategori,
          namaAlat: inv.namaAlat,
          standar: 0,
          tergelar: 0,
          baik: 0,
          rusak: 0,
        };
        map.set(key, item);
      }

      item.tergelar += inv.jumlah;
      if (inv.kondisi === "BAIK") {
        item.baik += inv.jumlah;
      } else if (inv.kondisi === "RUSAK") {
        item.rusak += inv.jumlah;
      }
    }

    const items: ItemPrioritas[] = Array.from(map.values()).map((item) => {
      const defisit = Math.max(0, item.standar - item.tergelar);
      const surplus = Math.max(0, item.tergelar - item.standar);
      const kebutuhanPengadaan = defisit + item.rusak;

      const persentasePemenuhan = item.standar === 0 
        ? 100 
        : parseFloat(((item.tergelar / item.standar) * 100).toFixed(1));

      const persentaseKesiapan = item.standar === 0 
        ? 100 
        : parseFloat(((item.baik / item.standar) * 100).toFixed(1));

      let tingkatPrioritas: ItemPrioritas["tingkatPrioritas"];
      let alasanPrioritas = "";

      if (kebutuhanPengadaan === 0 && persentaseKesiapan >= 100) {
        tingkatPrioritas = "TERPENUHI";
        alasanPrioritas = "Kebutuhan terpenuhi 100% dan kondisi siap operasional";
      } else if (item.tergelar === 0 || persentaseKesiapan < 50 || defisit >= 5) {
        tingkatPrioritas = "TINGGI";
        if (item.tergelar === 0) {
          alasanPrioritas = `Belum ada unit tergelar (Defisit ${defisit} unit)`;
        } else if (defisit > 0 && item.rusak > 0) {
          alasanPrioritas = `Defisit ${defisit} unit & ${item.rusak} unit rusak`;
        } else if (defisit > 0) {
          alasanPrioritas = `Defisit ${defisit} unit (Kesiapan hanya ${persentaseKesiapan}%)`;
        } else {
          alasanPrioritas = `${item.rusak} unit rusak butuh penggantian segera`;
        }
      } else if (persentaseKesiapan < 80 || defisit > 0) {
        tingkatPrioritas = "SEDANG";
        if (defisit > 0) {
          alasanPrioritas = `Defisit ${defisit} unit dari standar wajib`;
        } else {
          alasanPrioritas = `${item.rusak} unit rusak perlu peremajaan`;
        }
      } else {
        tingkatPrioritas = "RENDAH";
        alasanPrioritas = `${kebutuhanPengadaan} unit perlu penggantian/tambahan minor`;
      }

      return {
        id: item.id,
        satuanId: satuanId ? satuanRecord?.id : undefined,
        satuanNama: satuanId ? satuanRecord?.nama : "Semua Satuan",
        kategori: item.kategori,
        namaAlat: item.namaAlat,
        standar: item.standar,
        tergelar: item.tergelar,
        baik: item.baik,
        rusak: item.rusak,
        defisit,
        surplus,
        kebutuhanPengadaan,
        persentasePemenuhan,
        persentaseKesiapan,
        tingkatPrioritas,
        alasanPrioritas,
      };
    });

    // Priority ordering weight
    const priorityWeight: Record<ItemPrioritas["tingkatPrioritas"], number> = {
      TINGGI: 1,
      SEDANG: 2,
      RENDAH: 3,
      TERPENUHI: 4,
    };

    items.sort((a, b) => {
      const weightDiff = priorityWeight[a.tingkatPrioritas] - priorityWeight[b.tingkatPrioritas];
      if (weightDiff !== 0) return weightDiff;
      // If same priority, highest kebutuhanPengadaan first
      if (b.kebutuhanPengadaan !== a.kebutuhanPengadaan) {
        return b.kebutuhanPengadaan - a.kebutuhanPengadaan;
      }
      // Then lower persentaseKesiapan first
      return a.persentaseKesiapan - b.persentaseKesiapan;
    });

    const summary = {
      totalItem: items.length,
      totalStandar: items.reduce((acc, curr) => acc + curr.standar, 0),
      totalTergelar: items.reduce((acc, curr) => acc + curr.tergelar, 0),
      totalDefisit: items.reduce((acc, curr) => acc + curr.defisit, 0),
      totalRusak: items.reduce((acc, curr) => acc + curr.rusak, 0),
      totalKebutuhanPengadaan: items.reduce((acc, curr) => acc + curr.kebutuhanPengadaan, 0),
      prioritasTinggiCount: items.filter((i) => i.tingkatPrioritas === "TINGGI").length,
      prioritasSedangCount: items.filter((i) => i.tingkatPrioritas === "SEDANG").length,
      prioritasRendahCount: items.filter((i) => i.tingkatPrioritas === "RENDAH").length,
      terpenuhiCount: items.filter((i) => i.tingkatPrioritas === "TERPENUHI").length,
    };

    const result: PrioritasResult = { summary, items };
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Prioritas Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
