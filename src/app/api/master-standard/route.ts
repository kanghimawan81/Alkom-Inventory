import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const satuanId = searchParams.get("satuanId");

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filters = satuanId ? { satuanId } : {};

    const data = await prisma.masterStandarAlat.findMany({
      where: filters,
      include: { satuan: true },
      orderBy: { namaAlat: "asc" }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Master Standar Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { satuanId, kategori, namaAlat, jumlahWajib } = body;

    if (!satuanId || !kategori || !namaAlat || typeof jumlahWajib !== 'number') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    if (jumlahWajib < 0) {
      return NextResponse.json({ error: "Jumlah wajib tidak boleh negatif" }, { status: 422 });
    }

    const data = await prisma.masterStandarAlat.upsert({
      where: {
        satuanId_namaAlat: {
          satuanId,
          namaAlat
        }
      },
      update: {
        jumlahWajib,
        kategori
      },
      create: {
        satuanId,
        kategori,
        namaAlat,
        jumlahWajib
      }
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST Master Standar Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 422 });
    }

    await prisma.masterStandarAlat.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Master Standar Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
