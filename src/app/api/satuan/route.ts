import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const satuan = await prisma.satuan.findMany({
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        kodeSatuan: true,
      },
    });

    return NextResponse.json(satuan);
  } catch (error) {
    console.error("GET Satuan Error:", error);
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
    const { nama, kodeSatuan, id } = body;

    if (!nama || !kodeSatuan) {
      return NextResponse.json(
        { error: "Nama dan Kode Satuan wajib diisi" },
        { status: 422 }
      );
    }

    const satuan = await prisma.satuan.create({
      data: {
        ...(id ? { id } : {}),
        nama,
        kodeSatuan,
      },
    });

    return NextResponse.json(satuan, { status: 201 });
  } catch (error) {
    console.error("POST Satuan Error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan satuan (mungkin nama atau kode sudah ada)" },
      { status: 500 }
    );
  }
}
