import type { EndpointStat, Job, JobInput, JobOptions, ProfileResult } from "@/lib/types";
import { orchestrate, type OrchestrateResult } from "@/lib/rapidapi/orchestrator";
import { ENDPOINT_CATALOG } from "@/lib/rapidapi/catalog";

const DEMO_USER = "demo_user";

const jobs = new Map<string, Job>();
const endpointStats = new Map<string, EndpointStat>();
const circuits = new Map<string, { open: boolean; until: number }>();

for (const e of ENDPOINT_CATALOG) {
  endpointStats.set(e.id, {
    endpoint: e.id,
    requests: 0,
    successes: 0,
    failures: 0,
    avg_latency_ms: 0,
    cost_cents: 0,
    contacts_found: 0,
    circuit_open: false,
  });
}

function genId(): string {
  return "job_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function createJob(input: {
  name: string;
  source: { type: string; items: string[] };
  options: JobOptions;
  outputs: string[];
  webhook_url?: string;
  tags: string[];
}): Job {
  const id = genId();
  const jobInput: JobInput = {
    name: input.name,
    source: { type: input.source.type as JobInput["source"]["type"], items: input.source.items },
    options: input.options,
    outputs: input.outputs as JobInput["outputs"],
    webhook_url: input.webhook_url,
    tags: input.tags,
  };
  const job: Job = {
    id,
    user_id: DEMO_USER,
    name: input.name,
    input: jobInput,
    status: "queued",
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
    progress: {
      total: input.source.items.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      emails_found: 0,
      whatsapps_found: 0,
    },
    results: [],
    cost_cents: 0,
    error: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(): Job[] {
  return Array.from(jobs.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getEndpointStats(): EndpointStat[] {
  return ENDPOINT_CATALOG.map((e) => endpointStats.get(e.id)!).filter(Boolean);
}

export function isCircuitOpen(id: string): boolean {
  const c = circuits.get(id);
  if (!c) return false;
  if (c.open && Date.now() < c.until) return true;
  if (c.open && Date.now() >= c.until) {
    c.open = false;
    return false;
  }
  return false;
}

function recordStat(
  id: string,
  latency: number,
  ok: boolean,
  cost: number,
  contactFound: boolean
) {
  const s = endpointStats.get(id);
  if (!s) return;
  s.requests += 1;
  s.avg_latency_ms = Math.round((s.avg_latency_ms * (s.requests - 1) + latency) / s.requests);
  s.cost_cents += cost;
  if (ok) s.successes += 1;
  else {
    s.failures += 1;
    const failureRate = s.failures / s.requests;
    if (s.requests > 10 && failureRate > 0.3) {
      circuits.set(id, { open: true, until: Date.now() + 10 * 60 * 1000 });
      s.circuit_open = true;
    }
  }
  if (contactFound) s.contacts_found += 1;
}

export async function runJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = "running";
  job.started_at = new Date().toISOString();

  const items = job.input.source.items;
  const opts = job.input.options;

  for (const raw of items) {
    const username = String(raw).trim();
    if (!username) continue;
    try {
      const ctx = {
        username,
        endpointIds: opts.endpoints ?? ["auto"],
        enrichment: opts.enrichment,
        onStat: (id: string, _patch: Partial<EndpointStat>, latency: number, ok: boolean, cost: number, found: boolean) =>
          recordStat(id, latency, ok, cost, found),
        isCircuitOpen,
      };
      const res: OrchestrateResult = await orchestrate(ctx);
      job.results.push(res.result);
      job.cost_cents += res.totalCostCents;
      job.progress.processed += 1;
      if (res.result.errors.length === 0 || res.result.email.value || res.result.whatsapp.value) {
        job.progress.succeeded += 1;
      } else {
        job.progress.failed += 1;
      }
      if (res.result.email.value && res.result.email.valid !== false) {
        job.progress.emails_found += 1;
      }
      if (res.result.whatsapp.value && res.result.whatsapp.valid_format) {
        job.progress.whatsapps_found += 1;
      }
    } catch (e) {
      job.progress.processed += 1;
      job.progress.failed += 1;
      const err = e instanceof Error ? e.message : "unknown";
      job.results.push(emptyError(username, err));
    }
  }

  job.status = "completed";
  job.finished_at = new Date().toISOString();

  if (job.input.outputs.includes("webhook") && job.input.webhook_url) {
    fireWebhook(job.input.webhook_url, job).catch(() => {});
  }
}

function emptyError(username: string, error: string): ProfileResult {
  return {
    username,
    full_name: null,
    bio: null,
    category: null,
    is_business: false,
    is_verified: false,
    followers: null,
    following: null,
    posts: null,
    bio_link: null,
    email: { value: null, source: "none", valid: false, confidence: 0 },
    whatsapp: { value: null, wa_me: null, source: "none", valid_format: false, country: null },
    lead_score: 0,
    sources_used: [],
    errors: [error],
    extracted_at: new Date().toISOString(),
    cost_cents: 0,
  };
}

async function fireWebhook(url: string, job: Job): Promise<void> {
  const payload = {
    event: "job.completed",
    job_id: job.id,
    name: job.name,
    status: job.status,
    progress: job.progress,
    cost_cents: job.cost_cents,
    results_count: job.results.length,
    results: job.results,
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-instact-signature": "demo" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* swallow */
  }
}

export function resetStats(): void {
  for (const e of ENDPOINT_CATALOG) {
    endpointStats.set(e.id, {
      endpoint: e.id,
      requests: 0,
      successes: 0,
      failures: 0,
      avg_latency_ms: 0,
      cost_cents: 0,
      contacts_found: 0,
      circuit_open: false,
    });
  }
  circuits.clear();
}
