import type { Job, ProfileResult } from "@/lib/types";

const COLUMNS: { key: string; label: string }[] = [
  { key: "username", label: "username" },
  { key: "full_name", label: "full_name" },
  { key: "category", label: "category" },
  { key: "is_business", label: "is_business" },
  { key: "is_verified", label: "is_verified" },
  { key: "followers", label: "followers" },
  { key: "following", label: "following" },
  { key: "posts", label: "posts" },
  { key: "bio", label: "bio" },
  { key: "bio_link", label: "bio_link" },
  { key: "email", label: "email" },
  { key: "email_valid", label: "email_valid" },
  { key: "whatsapp", label: "whatsapp" },
  { key: "whatsapp_valid", label: "whatsapp_valid" },
  { key: "wa_me_link", label: "wa_me_link" },
  { key: "lead_score", label: "lead_score" },
  { key: "source_endpoints", label: "source_endpoints" },
  { key: "extracted_at", label: "extracted_at" },
  { key: "cost_cents", label: "cost_cents" },
];

function rowValue(p: ProfileResult, key: string): string {
  switch (key) {
    case "email":
      return p.email.value ?? "";
    case "email_valid":
      return p.email.valid === undefined ? "" : String(p.email.valid);
    case "whatsapp":
      return p.whatsapp.value ?? "";
    case "whatsapp_valid":
      return String(p.whatsapp.valid_format);
    case "wa_me_link":
      return p.whatsapp.wa_me ?? "";
    case "source_endpoints":
      return p.sources_used.join("|");
    default:
      return String((p as unknown as Record<string, unknown>)[key] ?? "");
  }
}

function escCsv(v: string): string {
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function toCSV(job: Job): string {
  const header = COLUMNS.map((c) => c.label).join(",");
  const lines = job.results.map((p) =>
    COLUMNS.map((c) => escCsv(rowValue(p, c.key))).join(",")
  );
  return [header, ...lines].join("\n");
}

export function toJSON(job: Job): string {
  return JSON.stringify(
    {
      job_id: job.id,
      name: job.name,
      extracted_at: job.finished_at ?? new Date().toISOString(),
      progress: job.progress,
      cost_cents: job.cost_cents,
      results: job.results,
    },
    null,
    2
  );
}

export function toXlsx(job: Job): string {
  const rows = job.results
    .map(
      (p) =>
        `<Row>${COLUMNS.map((c) => `<Cell><Data ss:Type="String">${escapeXml(rowValue(p, c.key))}</Data></Cell>`).join("")}</Row>`
    )
    .join("");
  const headerRow = `<Row>${COLUMNS.map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join("")}</Row>`;
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Leads">
<Table>${headerRow}${rows}</Table>
</Worksheet>
</Workbook>`;
}

export function toNotionMarkdown(job: Job): string {
  const lines = job.results
    .filter((p) => p.email.value || p.whatsapp.value)
    .map((p) => {
      return `- **@${p.username}** (${p.full_name ?? "—"})\n  - Categoria: ${p.category ?? "—"}\n  - Seguidores: ${p.followers ?? "—"}\n  - E-mail: ${p.email.value ?? "—"} ${p.email.valid ? "✓" : ""}\n  - WhatsApp: ${p.whatsapp.value ?? "—"} ${p.whatsapp.valid_format ? "✓" : ""}\n  - Lead Score: ${p.lead_score ?? "—"}`;
    });
  return `# ${job.name}\n\n${lines.join("\n\n")}`;
}

export function webhookPayload(job: Job): unknown {
  return {
    event: "job.completed",
    job_id: job.id,
    name: job.name,
    status: job.status,
    progress: job.progress,
    cost_cents: job.cost_cents,
    results: job.results,
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
