import { ENDPOINT_CATALOG, getEndpoint } from "@/lib/rapidapi/catalog";
import { callEndpoint, type RawProfilePayload } from "@/lib/rapidapi/client";
import type {
  EndpointStat,
  ProfileResult,
  ContactField,
  WhatsAppField,
} from "@/lib/types";
import { enrichProfile } from "@/lib/enrichment";

export interface OrchestrateContext {
  username: string;
  endpointIds: string[];
  enrichment: {
    validate_email: boolean;
    check_whatsapp: boolean;
    lead_score: boolean;
  };
  onStat: (endpointId: string, patch: Partial<EndpointStat>, latency: number, ok: boolean, cost: number, contactFound: boolean) => void;
  isCircuitOpen: (endpointId: string) => boolean;
}

export interface OrchestrateResult {
  result: ProfileResult;
  sourcesUsed: string[];
  totalCostCents: number;
}

export async function orchestrate(ctx: OrchestrateContext): Promise<OrchestrateResult> {
  const clean = ctx.username.replace(/^@/, "").trim();
  let chosen: RawProfilePayload | null = null;
  const sourcesUsed: string[] = [];
  let totalCostCents = 0;
  const errors: string[] = [];

  const order = resolveOrder(ctx.endpointIds);

  for (const id of order) {
    if (ctx.isCircuitOpen(id)) {
      errors.push(`${id}:circuit_open`);
      continue;
    }
    const meta = getEndpoint(id);
    if (!meta) continue;

    const { data, ok, error, latency_ms } = await callEndpoint(meta, clean);
    totalCostCents += meta.cost_per_request_cents;
    const contactFound = !!(data?.email || data?.phone || data?.whatsapp);
    ctx.onStat(id, {}, latency_ms, ok, meta.cost_per_request_cents, contactFound);

    if (!ok) {
      errors.push(`${id}:${error ?? "error"}`);
      continue;
    }
    if (!data) {
      errors.push(`${id}:empty`);
      continue;
    }

    chosen = mergePayload(chosen, data, id);
    sourcesUsed.push(id);

    const hasEmail = !!chosen.email;
    const hasWhats = !!(chosen.whatsapp || chosen.phone);
    if (hasEmail && hasWhats) break;
  }

  if (!chosen) {
    const empty = emptyResult(clean, errors, totalCostCents);
    return { result: empty, sourcesUsed, totalCostCents };
  }

  const base = buildProfile(clean, chosen, sourcesUsed, errors, totalCostCents);
  const result = enrichProfile(base, ctx.enrichment);
  return { result, sourcesUsed, totalCostCents };
}

function resolveOrder(endpointIds: string[]): string[] {
  if (endpointIds.length === 0 || endpointIds.includes("auto")) {
    return ENDPOINT_CATALOG.sort((a, b) => a.priority - b.priority).map((e) => e.id);
  }
  return endpointIds;
}

function mergePayload(
  current: RawProfilePayload | null,
  next: RawProfilePayload,
  source: string
): RawProfilePayload {
  if (!current) return { ...next, _source: source } as RawProfilePayload & { _source: string };
  return {
    username: next.username || current.username,
    full_name: current.full_name ?? next.full_name,
    bio: current.bio ?? next.bio,
    category: current.category ?? next.category,
    is_business: current.is_business || next.is_business,
    is_verified: current.is_verified || next.is_verified,
    followers: current.followers ?? next.followers,
    following: current.following ?? next.following,
    posts: current.posts ?? next.posts,
    bio_link: current.bio_link ?? next.bio_link,
    email: current.email ?? next.email,
    phone: current.phone ?? next.phone,
    whatsapp: current.whatsapp ?? next.whatsapp,
    contact_emails: current.contact_emails ?? next.contact_emails,
    contact_phones: current.contact_phones ?? next.contact_phones,
  };
}

function buildProfile(
  username: string,
  p: RawProfilePayload,
  sourcesUsed: string[],
  errors: string[],
  costCents: number
): ProfileResult {
  const email: ContactField = {
    value: p.email ?? null,
    source: sourcesUsed.find((s) => getEndpoint(s)?.capabilities.includes("email")) ?? "unknown",
    valid: undefined,
    confidence: undefined,
  };
  const whatsapp: WhatsAppField = {
    value: p.whatsapp ?? p.phone ?? null,
    wa_me: null,
    source: sourcesUsed.find((s) => getEndpoint(s)?.capabilities.some((c) => ["whatsapp", "phone"].includes(c))) ?? "unknown",
    valid_format: false,
    country: null,
  };
  return {
    username,
    full_name: p.full_name ?? null,
    bio: p.bio ?? null,
    category: p.category ?? null,
    is_business: p.is_business ?? false,
    is_verified: p.is_verified ?? false,
    followers: p.followers ?? null,
    following: p.following ?? null,
    posts: p.posts ?? null,
    bio_link: p.bio_link ?? null,
    email,
    whatsapp,
    lead_score: null,
    sources_used: sourcesUsed,
    errors,
    extracted_at: new Date().toISOString(),
    cost_cents: costCents,
  };
}

function emptyResult(username: string, errors: string[], costCents: number): ProfileResult {
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
    errors,
    extracted_at: new Date().toISOString(),
    cost_cents: costCents,
  };
}
