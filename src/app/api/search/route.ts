import { NextRequest } from "next/server";
import type { Lead } from "@/lib/types";
import { searchMultiEngines, scrapePageForLeads, type SearchResult } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export async function POST(req: NextRequest) {
  let body: { profession?: string; state?: string; max?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const profession = (body.profession ?? "").trim();
  const state = (body.state ?? "").trim().toUpperCase();
  const max = Math.min(body.max ?? 30, 60);

  if (!profession) {
    return new Response(JSON.stringify({ error: "profession_required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const stateLabel = BR_STATES.includes(state) ? state : "";

  const queries = buildQueries(profession, stateLabel);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("progress", { status: "searching", current_source: "Buscando...", total_found: 0, with_email: 0, with_phone: 0, sources_tried: [] });

      const allLeads: Lead[] = [];
      const seenUrls = new Set<string>();
      const seenContacts = new Set<string>();

      for (let qi = 0; qi < queries.length; qi++) {
        const q = queries[qi];
        send("progress", {
          status: "searching",
          current_source: `Busca ${qi + 1}/${queries.length}: ${q.slice(0, 60)}`,
          total_found: allLeads.length,
          with_email: allLeads.filter((l) => l.email).length,
          with_phone: allLeads.filter((l) => l.phone).length,
          sources_tried: [...new Set(allLeads.map((l) => l.source))],
        });

        const results: SearchResult[] = await searchMultiEngines(q, max);

        for (const result of results) {
          if (seenUrls.has(result.url)) continue;
          seenUrls.add(result.url);

          try {
            const leads = await scrapePageForLeads(result, profession, stateLabel);
            for (const lead of leads) {
              const key = `${lead.email ?? ""}|${lead.phone ?? ""}`;
              if (seenContacts.has(key)) continue;
              seenContacts.add(key);
              allLeads.push(lead);
              send("lead", lead);
            }
          } catch {
            /* skip failed page */
          }

          send("progress", {
            status: "searching",
            current_source: `Processando ${sourceShort(result.url)}`,
            total_found: allLeads.length,
            with_email: allLeads.filter((l) => l.email).length,
            with_phone: allLeads.filter((l) => l.phone).length,
            sources_tried: [...new Set(allLeads.map((l) => l.source))],
          });

          if (allLeads.length >= max) break;
          await sleep(300);
        }

        if (allLeads.length >= max) break;
      }

      send("progress", {
        status: "done",
        current_source: null,
        total_found: allLeads.length,
        with_email: allLeads.filter((l) => l.email).length,
        with_phone: allLeads.filter((l) => l.phone).length,
        sources_tried: [...new Set(allLeads.map((l) => l.source))],
      });
      send("complete", { total: allLeads.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

function buildQueries(profession: string, state: string): string[] {
  const queries: string[] = [];
  const loc = state || "Brasil";
  queries.push(`${profession} ${loc} email telefone contato`);
  queries.push(`"${profession}" "${loc}" contato email`);
  queries.push(`site:instagram.com ${profession} ${loc}`);
  queries.push(`site:linkedin.com/in ${profession} ${loc}`);
  queries.push(`${profession} ${loc} whatsapp agende`);
  return queries;
}

function sourceShort(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
