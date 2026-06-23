import { NextResponse } from "next/server";
import { getEndpointStats, resetStats } from "@/lib/store";
import { ENDPOINT_CATALOG } from "@/lib/rapidapi/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = getEndpointStats();
  return NextResponse.json({
    endpoints: ENDPOINT_CATALOG.map((e) => ({
      ...e,
      stats: stats.find((s) => s.endpoint === e.id),
    })),
  });
}

export async function DELETE() {
  resetStats();
  return NextResponse.json({ ok: true });
}
