import { NextRequest, NextResponse } from "next/server";
import { createJob, runJob, listJobs } from "@/lib/store";
import { consumeCredits } from "@/lib/credits";
import type { JobOptions, OutputFormat } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface CreateJobBody {
  name?: string;
  source?: { type?: string; items?: string[] };
  options?: JobOptions;
  outputs?: OutputFormat[];
  webhook_url?: string;
  tags?: string[];
}

export async function GET() {
  return NextResponse.json({ jobs: listJobs().map(serializeJob) });
}

export async function POST(req: NextRequest) {
  let body: CreateJobBody;
  try {
    body = (await req.json()) as CreateJobBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const items = body?.source?.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "missing_items" }, { status: 400 });
  }
  if (items.length > 10000) {
    return NextResponse.json({ error: "too_many_items" }, { status: 400 });
  }

  const job = createJob({
    name: body.name || `Extração ${new Date().toISOString()}`,
    source: { type: body.source?.type ?? "usernames", items },
    options: body.options ?? {
      endpoints: ["auto"],
      enrichment: { validate_email: true, check_whatsapp: true, lead_score: true },
      filters: {},
      dedup: true,
      cache_ttl_hours: 24,
    },
    outputs: body.outputs ?? ["xlsx", "csv", "json"],
    webhook_url: body.webhook_url,
    tags: body.tags ?? [],
  });

  runJob(job.id)
    .then(() => {
      consumeCredits("demo_user", job.cost_cents);
    })
    .catch((e) => {
      console.error("job_run_error", e);
    });

  return NextResponse.json({ id: job.id, status: job.status }, { status: 202 });
}

function serializeJob(j: ReturnType<typeof listJobs>[number]) {
  return {
    id: j.id,
    name: j.name,
    status: j.status,
    created_at: j.created_at,
    started_at: j.started_at,
    finished_at: j.finished_at,
    progress: j.progress,
    cost_cents: j.cost_cents,
    results_count: j.results.length,
  };
}
