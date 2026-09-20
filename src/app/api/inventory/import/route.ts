import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseInventoryWorkbook } from "@/lib/excel";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR_SATUAN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let satuanId = formData.get("satuanId") as string | null;

    if (session.user.role === "OPERATOR_SATUAN") {
      satuanId = session.user.satuanId;
    }

    if (!file || !satuanId) {
      return NextResponse.json({ error: "File and Satuan ID are required" }, { status: 422 });
    }

    // Validate size (e.g. max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 422 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedData;
    try {
      parsedData = parseInventoryWorkbook(buffer);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse Excel file";
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    if (!parsedData.length) {
      return NextResponse.json({ error: "No valid data found in spreadsheet" }, { status: 422 });
    }

    // Transaction for batch upsert
    let count = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      // For simplicity, we process one by one in transaction
      for (const item of parsedData) {
        try {
          // Check if already exists to do upsert properly
          // Note: Since Prisma's composite unique is needed for upsert and we have an index on [satuanId, namaAlat] 
          // wait, the schema only has @@index for InventarisTergelar. It doesn't have @@unique.
          // Let's find first then update or create.
          
          const existing = await tx.inventarisTergelar.findFirst({
            where: {
              satuanId: satuanId,
              namaAlat: item.namaAlat,
            }
          });

          if (existing) {
            await tx.inventarisTergelar.update({
              where: { id: existing.id },
              data: {
                jumlah: item.jumlah,
                kondisi: item.kondisi,
                kategori: item.kategori,
                diperbarui: new Date(),
              }
            });
          } else {
            await tx.inventarisTergelar.create({
              data: {
                satuanId: satuanId,
                namaAlat: item.namaAlat,
                jumlah: item.jumlah,
                kondisi: item.kondisi,
                kategori: item.kategori,
              }
            });
          }
          count++;
        } catch {
          errors.push(`Gagal memproses baris alat: ${item.namaAlat}`);
        }
      }
    });

    return NextResponse.json({ success: true, count, errors }, { status: 201 });
  } catch (error) {
    console.error("POST Inventory Import Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
