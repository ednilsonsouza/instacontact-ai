import { NextRequest } from "next/server";
import type { Lead } from "@/lib/types";
import { googleSearch, scrapePageForLeads, type SearchResult } from "@/lib/scraper";

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
  const max = Math.min(body.max ?? 30, 50);

  if (!profession) {
    return new Response(JSON.stringify({ error: "profession_required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const stateLabel = BR_STATES.includes(state) ? state : "Brasil";
  const queries = buildQueries(profession, stateLabel);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("progress", { status: "searching", current_source: "Buscando no Google...", total_found: 0, with_email: 0, with_phone: 0, sources_tried: [] });

      const allLeads: Lead[] = [];
      const seenUrls = new Set<string>();
      const seenContacts = new Set<string>();

      for (let qi = 0; qi < queries.length; qi++) {
        const q = queries[qi];
        send("progress", {
          status: "searching",
          current_source: `Busca ${qi + 1}/${queries.length}: "${q.slice(0, 50)}"`,
          total_found: allLeads.length,
          with_email: allLeads.filter((l) => l.email).length,
          with_phone: allLeads.filter((l) => l.phone).length,
          sources_tried: [...new Set(allLeads.map((l) => l.source))],
        });

        const results: SearchResult[] = [];
        for (const start of [1, 11]) {
          const batch = await googleSearch(q, start);
          results.push(...batch);
          if (batch.length < 10) break;
          await sleep(200);
        }

        send("progress", {
          status: "searching",
          current_source: `Analisando ${results.length} páginas...`,
          total_found: allLeads.length,
          with_email: allLeads.filter((l) => l.email).length,
          with_phone: allLeads.filter((l) => l.phone).length,
          sources_tried: [...new Set(allLeads.map((l) => l.source))],
        });

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
            /* skip */
          }

          if (allLeads.length >= max) break;
          await sleep(150);
        }

        if (allLeads.length >= max) break;
        await sleep(300);
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
  return [
    `${profession} ${state} email telefone contato`,
    `"${profession}" "${state}" contato email`,
    `site:instagram.com ${profession} ${state}`,
    `site:linkedin.com/in ${profession} ${state}`,
    `${profession} ${state} whatsapp agende`,
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
