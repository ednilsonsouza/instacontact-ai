import type { RapidApiEndpointMeta } from "@/lib/types";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export interface RawProfilePayload {
  username: string;
  full_name?: string | null;
  bio?: string | null;
  category?: string | null;
  is_business?: boolean;
  is_verified?: boolean;
  followers?: number | null;
  following?: number | null;
  posts?: number | null;
  bio_link?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contact_emails?: string[] | null;
  contact_phones?: string[] | null;
}

export async function callEndpoint(
  endpoint: RapidApiEndpointMeta,
  username: string
): Promise<{ data: RawProfilePayload | null; ok: boolean; error?: string; latency_ms: number }> {
  const start = Date.now();
  const url = `https://${endpoint.host}${endpoint.path}?username=${encodeURIComponent(username)}`;

  if (!RAPIDAPI_KEY) {
    return mockEndpoint(endpoint, username);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": endpoint.host,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const latency_ms = Date.now() - start;
    if (res.status === 429) {
      return { data: null, ok: false, error: "rate_limit", latency_ms };
    }
    if (res.status === 404) {
      return { data: null, ok: false, error: "not_found", latency_ms };
    }
    if (!res.ok) {
      return { data: null, ok: false, error: `http_${res.status}`, latency_ms };
    }
    const json = await res.json();
    const data = normalizePayload(endpoint, json, username);
    return { data, ok: true, latency_ms };
  } catch (e) {
    const latency_ms = Date.now() - start;
    const err = e instanceof Error ? e.message : "unknown_error";
    return { data: null, ok: false, error: err, latency_ms };
  }
}

function normalizePayload(
  endpoint: RapidApiEndpointMeta,
  json: unknown,
  username: string
): RawProfilePayload {
  const j = (json ?? {}) as Record<string, unknown>;
  const data = (j.data ?? j.result ?? j.user ?? j) as Record<string, unknown>;
  const contact_emails = Array.isArray(data.contact_emails)
    ? (data.contact_emails as string[])
    : null;
  const contact_phones = Array.isArray(data.contact_phones)
    ? (data.contact_phones as string[])
    : null;
  return {
    username: String(data.username ?? username),
    full_name: (data.full_name as string) ?? (data.fullName as string) ?? null,
    bio: (data.biography as string) ?? (data.bio as string) ?? null,
    category: (data.category_name as string) ?? (data.category as string) ?? null,
    is_business: Boolean(data.is_business ?? data.isBusiness),
    is_verified: Boolean(data.is_verified ?? data.isVerified),
    followers: toNum(data.followers ?? data.follower_count),
    following: toNum(data.following ?? data.following_count),
    posts: toNum(data.posts ?? data.media_count),
    bio_link: extractBioLink(data),
    email: pickEmail(data, contact_emails),
    phone: pickPhone(data, contact_phones),
    whatsapp: (data.whatsapp as string) ?? null,
    contact_emails,
    contact_phones,
  };
}

function extractBioLink(d: Record<string, unknown>): string | null {
  const ext = d.external_url as string | undefined;
  if (ext) return ext;
  const links = d.bio_links as unknown;
  if (Array.isArray(links) && links.length > 0) {
    const first = (links[0] as Record<string, unknown>).url as string | undefined;
    if (first) return first;
  }
  return null;
}

function pickEmail(d: Record<string, unknown>, list: string[] | null): string | null {
  const direct = (d.email as string) ?? (d.public_email as string) ?? null;
  if (direct) return direct;
  if (list && list.length > 0) return list[0];
  return null;
}

function pickPhone(d: Record<string, unknown>, list: string[] | null): string | null {
  const direct = (d.phone as string) ?? (d.public_phone as string) ?? null;
  if (direct) return direct;
  if (list && list.length > 0) return list[0];
  return null;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const MOCK_NAMES = [
  "Bianca Souza Makeup",
  "Studio Linda Beleza",
  "Corner Beauty Spa",
  "Pedro Martins Personal",
  "Lift Fitness Club",
  "Dra. Helena Cardoso",
  "Advocacia Lima",
  "Sabor & Cia Restaurante",
  "Click Studio Foto",
  "Bloom Floricultura",
];

const MOCK_CATEGORIES = [
  "Makeup Artist",
  "Health/Beauty",
  "Personal Trainer",
  "Fitness Center",
  "Doctor",
  "Lawyer",
  "Restaurant",
  "Photographer",
  "Florist",
];

const MOCK_DOMAINS = [
  "contato",
  "hello",
  "agenda",
  "commercial",
  "atendimento",
  "reservas",
];

const MOCK_DOMAIN_SUFFIX = ["gmail.com", "outlook.com", "instagram.bio", "proton.me"];

export function mockEndpoint(
  endpoint: RapidApiEndpointMeta,
  username: string
): { data: RawProfilePayload | null; ok: boolean; error?: string; latency_ms: number } {
  const seed = hash(username + endpoint.id);
  const followers = 500 + (seed % 60000);
  const is_business = seed % 10 !== 0;
  const idx = seed % MOCK_NAMES.length;
  const full = MOCK_NAMES[idx];
  const category = MOCK_CATEGORIES[idx];
  const baseBio = `${full.split(" ")[0]} | ${category} | São Paulo`;
  const bio = `${baseBio} | Agende: WhatsApp 11 9${(1000 + (seed % 8999))}-${(1000 + (seed % 8999))}`;

  const hasEmail = endpoint.capabilities.includes("email") && seed % 100 < 55;
  const hasWhats = endpoint.capabilities.some((c) => ["whatsapp", "phone"].includes(c)) && seed % 100 < 45;

  const email = hasEmail
    ? `${MOCK_DOMAINS[seed % MOCK_DOMAINS.length]}@${MOCK_DOMAIN_SUFFIX[seed % MOCK_DOMAIN_SUFFIX.length]}`
    : null;
  const phone = hasWhats ? `+55 11 9${(1000 + (seed % 8999))}-${(1000 + (seed % 8999))}` : null;

  const latency_ms = 200 + (seed % 1800);

  if (seed % 20 === 0) {
    return { data: null, ok: false, error: "empty_payload", latency_ms };
  }

  return {
    data: {
      username,
      full_name: full,
      bio,
      category,
      is_business,
      is_verified: seed % 50 === 0,
      followers,
      following: 100 + (seed % 2000),
      posts: 30 + (seed % 500),
      bio_link: `https://linktr.ee/${username.replace(/^@/, "")}`,
      email,
      phone,
      whatsapp: phone,
      contact_emails: email ? [email] : null,
      contact_phones: phone ? [phone] : null,
    },
    ok: true,
    latency_ms,
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
