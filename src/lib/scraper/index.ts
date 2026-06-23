import * as cheerio from "cheerio";
import type { Lead } from "@/lib/types";
import { extractEmails, extractPhones, extractWhatsApp } from "@/lib/extractors";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS: Record<string, string> = {
  "user-agent": UA,
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
};

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function googleSearch(query: string, start = 1): Promise<SearchResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return mockSearch(query);
  }
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&start=${start}&num=10&hl=pt-BR&country=BR`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("google_search_error", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const items = (data.items ?? []) as Array<{
      title: string;
      link: string;
      snippet?: string;
    }>;
    return items.map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet ?? "",
    }));
  } catch (e) {
    console.error("google_search_fetch_error", e);
    return [];
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    clearTimeout(t);
    return "";
  }
}

export async function scrapePageForLeads(
  result: SearchResult,
  profession: string,
  state: string
): Promise<Lead[]> {
  const html = await fetchHtml(result.url);
  if (!html) {
    const emails = extractEmails(`${result.title} ${result.snippet}`);
    const phones = extractPhones(`${result.title} ${result.snippet}`);
    const whatsapp = extractWhatsApp(`${result.title} ${result.snippet}`);
    if (emails.length === 0 && phones.length === 0 && !whatsapp) return [];
    return [buildLead(result, profession, state, emails[0] ?? null, phones[0]?.phone ?? null, whatsapp, result.snippet || null)];
  }

  const $ = cheerio.load(html);
  const bodyText = $("body").text() ?? "";
  const title = $("title").first().text().trim() || result.title;
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";
  const combined = `${title} ${metaDesc} ${result.snippet} ${bodyText}`;

  const emails = extractEmails(combined);
  const phones = extractPhones(combined);
  const whatsapp = extractWhatsApp(combined);

  if (emails.length === 0 && phones.length === 0 && !whatsapp) return [];

  const lead = buildLead(
    result,
    profession,
    state,
    emails[0] ?? null,
    phones[0]?.phone ?? null,
    whatsapp ?? phones.find((p) => p.whatsapp)?.whatsapp ?? null,
    metaDesc || result.snippet || null
  );
  lead.name = extractName($, result);
  lead.image_url = extractImage($);

  const extraLeads: Lead[] = [];
  const extraEmails = emails.slice(1, 4);
  const extraPhones = phones.slice(1, 4);
  for (let i = 0; i < Math.max(extraEmails.length, extraPhones.length); i++) {
    extraLeads.push({
      ...lead,
      id: hashId(result.url + "x" + i),
      email: extraEmails[i] ?? null,
      phone: extraPhones[i]?.phone ?? null,
    });
  }
  return [lead, ...extraLeads];
}

function buildLead(
  result: SearchResult,
  profession: string,
  state: string,
  email: string | null,
  phone: string | null,
  whatsapp: string | null,
  bio: string | null
): Lead {
  return {
    id: hashId(result.url + email + phone + whatsapp),
    name: result.title.length < 120 ? result.title : null,
    email,
    phone,
    whatsapp,
    profession,
    location: state,
    source: sourceLabel(result.url),
    source_url: result.url,
    bio,
    profile_url: result.url,
    image_url: null,
    found_at: new Date().toISOString(),
  };
}

function extractName($: cheerio.CheerioAPI, result: SearchResult): string | null {
  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length < 120) return h1;
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle && ogTitle.length < 120) return ogTitle;
  return result.title.length < 120 ? result.title : null;
}

function extractImage($: cheerio.CheerioAPI): string | null {
  const og = $('meta[property="og:image"]').attr("content");
  if (og) return og;
  const img = $("img").first().attr("src");
  if (img && img.startsWith("http")) return img;
  return null;
}

function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("facebook")) return "Facebook";
    if (host.includes("apontador")) return "Apontador";
    if (host.includes("yelp")) return "Yelp";
    if (host.includes("gov.br")) return "Site oficial";
    return host;
  } catch {
    return "Web";
  }
}

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hashId(s: string): string {
  return "lead_" + hashNum(s).toString(36);
}

const MOCK_NAMES = [
  "Dra. Marina Costa", "Dr. Rafael Lima", "Ana Paula Souza", "Carlos Eduardo Silva",
  "Juliana Ferreira", "Pedro Henrique Santos", "Fernanda Oliveira", "Bruno Carvalho",
  "Camila Rodrigues", "Lucas Almeida", "Patrícia Gomes", "Rodrigo Martins",
];
const MOCK_DOMAINS = ["contato", "agenda", "comercial", "hello", "atendimento"];
const MOCK_SUFFIX = ["gmail.com", "outlook.com", "hotmail.com", "proton.me"];

function mockSearch(query: string): SearchResult[] {
  const prof = query.split(" ")[0] ?? "profissional";
  const results: SearchResult[] = [];
  for (let i = 0; i < 10; i++) {
    const name = MOCK_NAMES[i % MOCK_NAMES.length];
    const seed = hashNum(query + i);
    const hasEmail = seed % 100 < 60;
    const hasPhone = seed % 100 < 50;
    const email = hasEmail ? `${MOCK_DOMAINS[seed % MOCK_DOMAINS.length]}@${MOCK_SUFFIX[seed % MOCK_SUFFIX.length]}` : "";
    const phone = hasPhone ? `+55 11 9${1000 + (seed % 8999)}-${1000 + (seed % 8999)}` : "";
    results.push({
      title: `${name} — ${prof}`,
      url: `https://example-${i}.com/${prof}`,
      snippet: `${name} é ${prof} em São Paulo. ${email} ${phone}`.trim(),
    });
  }
  return results;
}
