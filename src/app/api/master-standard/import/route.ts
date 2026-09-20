import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMasterStandardWorkbook } from "@/lib/excel";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Hanya admin yang diizinkan mengunggah standar." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const defaultSatuanId = formData.get("satuanId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File Excel (.xlsx / .xls) wajib diunggah." }, { status: 422 });
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 10MB." }, { status: 422 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedData;
    try {
      parsedData = parseMasterStandardWorkbook(buffer);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal memproses file Excel";
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    if (!parsedData.length) {
      return NextResponse.json({ error: "Tidak ada baris data valid ditemukan di file Excel." }, { status: 422 });
    }

    // Pre-fetch all satuan to allow matching by name or kode if present
    const allSatuan = await prisma.satuan.findMany();
    const satuanLookup = new Map<string, string>();
    allSatuan.forEach((s) => {
      satuanLookup.set(s.id.toLowerCase(), s.id);
      satuanLookup.set(s.kodeSatuan.toLowerCase(), s.id);
      satuanLookup.set(s.nama.toLowerCase(), s.id);
    });

    let count = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of parsedData) {
        try {
          // Resolve target Satuan ID
          let targetSatuanId = defaultSatuanId;
          if (item.satuanNamaOrKode) {
            const foundId = satuanLookup.get(item.satuanNamaOrKode.toLowerCase());
            if (foundId) {
              targetSatuanId = foundId;
            }
          }

          if (!targetSatuanId) {
            errors.push(`Satuan tidak diketahui untuk alat: ${item.namaAlat}`);
            continue;
          }

          await tx.masterStandarAlat.upsert({
            where: {
              satuanId_namaAlat: {
                satuanId: targetSatuanId,
                namaAlat: item.namaAlat,
              },
            },
            update: {
              kategori: item.kategori,
              jumlahWajib: item.jumlahWajib,
            },
            create: {
              satuanId: targetSatuanId,
              kategori: item.kategori,
              namaAlat: item.namaAlat,
              jumlahWajib: item.jumlahWajib,
            },
          });
          count++;
        } catch {
          errors.push(`Gagal menyimpan standar: ${item.namaAlat}`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      count,
      errors: errors.slice(0, 10), // return up to 10 sample errors if any
    }, { status: 201 });
  } catch (error) {
    console.error("POST Master Standard Import Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
