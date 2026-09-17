import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Read by the ticker's client component — reads the DB, never the external
// APIs directly, so every viewer sees the same numbers on the same interval
// the server refresh runs on.
export async function GET() {
  const rows = await prisma.marketPrice.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ rows });
}
