import * as cheerio from "cheerio";
import type { Lead } from "@/lib/types";
import { extractEmails, extractPhones, extractWhatsApp } from "@/lib/extractors";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS: Record<string, string> = {
  "user-agent": UA,
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
};

const TIMEOUT_MS = 12000;

export interface FetchResult {
  html: string;
  url: string;
  ok: boolean;
  status: number;
  error?: string;
}

export async function fetchHtml(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });
    clearTimeout(t);
    const html = await res.text();
    return { html, url, ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(t);
    const err = e instanceof Error ? e.message : "fetch_error";
    return { html: "", url, ok: false, status: 0, error: err };
  }
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchDuckDuckGo(query: string, max = 20): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { html, ok } = await fetchHtml(url);
  if (!ok || !html) return [];
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $(".result .result__a, .result .links").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const title = $(el).text().trim();
    if (href && title) {
      results.push({ title, url: cleanDdgUrl(href), snippet: "" });
    }
  });
  $(".result .result__snippet").each((i, el) => {
    if (results[i]) results[i].snippet = $(el).text().trim();
  });
  return results.slice(0, max);
}

export async function searchGoogle(query: string, max = 20): Promise<SearchResult[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${max}&hl=pt-BR`;
  const { html, ok } = await fetchHtml(url);
  if (!ok || !html) return [];
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $("div.g, div.tF2CWe, div[data-sokoban-container]").each((_, el) => {
    const anchor = $(el).find("a[href]").first();
    const href = anchor.attr("href") ?? "";
    const title = anchor.find("h3, span, div").first().text().trim();
    const snippet = $(el).find("span.st, div.IsZrtc, div[data-content]").text().trim();
    if (href.startsWith("http") && title) {
      results.push({ title, url: href, snippet });
    }
  });
  return results.slice(0, max);
}

export async function searchBing(query: string, max = 20): Promise<SearchResult[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${max}&setlang=pt-BR`;
  const { html, ok } = await fetchHtml(url);
  if (!ok || !html) return [];
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $("li.b_algo").each((_, el) => {
    const anchor = $(el).find("h2 a").first();
    const href = anchor.attr("href") ?? "";
    const title = anchor.text().trim();
    const snippet = $(el).find(".b_caption p, .b_lineclamp2").text().trim();
    if (href && title) {
      results.push({ title, url: href, snippet });
    }
  });
  return results.slice(0, max);
}

export async function searchMultiEngines(query: string, max = 20): Promise<SearchResult[]> {
  const [ddg, bing] = await Promise.all([searchDuckDuckGo(query, max), searchBing(query, max)]);
  const merged = dedupByUrl([...ddg, ...bing]);
  if (merged.length < 5) {
    const google = await searchGoogle(query, max);
    return dedupByUrl([...merged, ...google]);
  }
  return merged;
}

function dedupByUrl(list: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of list) {
    const key = r.url.replace(/\/$/, "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

function cleanDdgUrl(href: string): string {
  const m = href.match(/[&?]uddg=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  if (href.startsWith("//")) return "https:" + href;
  return href;
}

export async function scrapePageForLeads(
  result: SearchResult,
  profession: string,
  state: string
): Promise<Lead[]> {
  const { html, ok } = await fetchHtml(result.url);
  if (!ok || !html) return [];

  const $ = cheerio.load(html);
  const bodyText = $("body").text() ?? "";
  const title = $("title").first().text().trim() || result.title;
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";
  const combined = `${title} ${metaDesc} ${result.snippet} ${bodyText}`;

  const emails = extractEmails(combined);
  const phones = extractPhones(combined);
  const whatsapp = extractWhatsApp(combined);

  if (emails.length === 0 && phones.length === 0 && !whatsapp) return [];

  const lead: Lead = {
    id: hashId(result.url + emails.join("") + phones.map((p) => p.phone).join("")),
    name: extractName($, result),
    email: emails[0] ?? null,
    phone: phones[0]?.phone ?? null,
    whatsapp: whatsapp ?? phones.find((p) => p.whatsapp)?.whatsapp ?? null,
    profession,
    location: state,
    source: sourceLabel(result.url),
    source_url: result.url,
    bio: metaDesc || result.snippet || null,
    profile_url: result.url,
    image_url: extractImage($),
    found_at: new Date().toISOString(),
  };

  const extraEmails = emails.slice(1);
  const extraPhones = phones.slice(1);
  const leads: Lead[] = [lead];
  for (let i = 0; i < Math.max(extraEmails.length, extraPhones.length); i++) {
    leads.push({
      ...lead,
      id: hashId(result.url + i + (extraEmails[i] ?? "") + (extraPhones[i]?.phone ?? "")),
      email: extraEmails[i] ?? null,
      phone: extraPhones[i]?.phone ?? null,
    });
  }
  return leads;
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
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("linkedin")) return "LinkedIn";
  if (host.includes("facebook")) return "Facebook";
  if (host.includes("apontador")) return "Apontador";
  if (host.includes("yelp")) return "Yelp";
  if (host.includes("catho")) return "Catho";
  if (host.includes("indeed")) return "Indeed";
  if (host.includes("gov.br") || host.includes("cfe.") || host.includes("crm.")) return "Site oficial";
  return host;
}

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return "lead_" + Math.abs(h).toString(36);
}
