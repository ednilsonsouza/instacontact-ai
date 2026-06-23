import { NextRequest, NextResponse } from "next/server";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { leads?: Lead[]; format?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const leads = body.leads ?? [];
  const format = body.format ?? "csv";

  if (format === "json") {
    return new NextResponse(JSON.stringify({ count: leads.length, leads }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="leads.json"`,
      },
    });
  }

  const headers = ["name", "email", "phone", "whatsapp", "profession", "location", "source", "source_url", "bio"];
  const rows = leads.map((l) =>
    headers.map((h) => escCsv(String((l as unknown as Record<string, unknown>)[h] ?? ""))).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leads.csv"`,
    },
  });
}

function escCsv(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
