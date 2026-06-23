import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    id: job.id,
    name: job.name,
    status: job.status,
    created_at: job.created_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
    progress: job.progress,
    cost_cents: job.cost_cents,
    input: job.input,
    results: job.results,
  });
}
