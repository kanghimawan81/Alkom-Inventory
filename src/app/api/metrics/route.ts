import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateMetrics } from "@/lib/metrics";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let satuanId = searchParams.get("satuanId");

    if (session.user.role === "OPERATOR_SATUAN") {
      satuanId = session.user.satuanId;
    }

    const filters = satuanId ? { satuanId } : {};

    const standarRaw = await prisma.masterStandarAlat.findMany({
      where: filters,
    });

    const tergelarRaw = await prisma.inventarisTergelar.findMany({
      where: filters,
    });

    const result = calculateMetrics(standarRaw, tergelarRaw);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET Metrics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
