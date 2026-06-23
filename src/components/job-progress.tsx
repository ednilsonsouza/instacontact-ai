"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress, Badge, Button } from "@/components/ui";
import Link from "next/link";
import { formatCents, formatNumber, formatPct, relativeTime } from "@/lib/utils";

interface JobView {
  id: string;
  name: string;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    emails_found: number;
    whatsapps_found: number;
  };
  cost_cents: number;
  results: Array<{
    username: string;
    full_name: string | null;
    category: string | null;
    followers: number | null;
    email: { value: string | null; valid?: boolean };
    whatsapp: { value: string | null; valid_format: boolean };
    lead_score: number | null;
    cost_cents: number;
  }>;
}

export function JobProgress({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobView | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as JobView;
        setJob(data);
        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          setPolling(false);
          if (timer) clearInterval(timer);
          router.refresh();
        }
      }
    }

    load();
    if (polling) {
      timer = setInterval(load, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, polling]);

  if (!job) {
    return <div className="text-sm text-[var(--muted)]">Carregando…</div>;
  }

  const emailRate = job.progress.processed ? (job.progress.emails_found / job.progress.processed) * 100 : 0;
  const waRate = job.progress.processed ? (job.progress.whatsapps_found / job.progress.processed) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/jobs" className="text-xs text-[var(--muted)] hover:text-white">
            ← Voltar para jobs
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{job.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>{relativeTime(job.created_at)}</span>
            <span>·</span>
            <span className="font-mono">{job.id}</span>
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/jobs/${job.id}/export?format=csv`}>
            <Button variant="secondary" size="sm">CSV</Button>
          </Link>
          <Link href={`/api/jobs/${job.id}/export?format=xlsx`}>
            <Button variant="secondary" size="sm">Excel</Button>
          </Link>
          <Link href={`/api/jobs/${job.id}/export?format=json`}>
            <Button variant="secondary" size="sm">JSON</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Perfis processados" value={`${job.progress.processed}/${job.progress.total}`} />
        <Kpi
          label="E-mails"
          value={formatNumber(job.progress.emails_found)}
          hint={`${emailRate.toFixed(1)}% de taxa`}
          tone={emailRate >= 40 ? "success" : "warning"}
        />
        <Kpi
          label="WhatsApp"
          value={formatNumber(job.progress.whatsapps_found)}
          hint={`${waRate.toFixed(1)}% de taxa`}
          tone={waRate >= 28 ? "success" : "warning"}
        />
        <Kpi label="Custo" value={formatCents(job.cost_cents)} tone="primary" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Progresso</h2>
          <span className="text-xs text-[var(--muted)]">
            {formatPct(job.progress.processed, job.progress.total)}
          </span>
        </div>
        <Progress value={job.progress.processed} max={job.progress.total} />
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <Metric label="Sucesso" value={job.progress.succeeded} />
          <Metric label="Falhas" value={job.progress.failed} tone="danger" />
          <Metric
            label="Com contato"
            value={job.results.filter((r) => r.email.value || r.whatsapp.value).length}
            tone="success"
          />
          <Metric
            label="Custo/perfil"
            value={
              job.progress.processed
                ? `${((job.cost_cents / job.progress.processed) / 100).toFixed(3)}$`
                : "—"
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-white">Resultados ({job.results.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="px-4 py-2.5 font-medium">Username</th>
                <th className="px-4 py-2.5 font-medium">Categoria</th>
                <th className="px-4 py-2.5 font-medium text-right">Seguidores</th>
                <th className="px-4 py-2.5 font-medium">E-mail</th>
                <th className="px-4 py-2.5 font-medium">WhatsApp</th>
                <th className="px-4 py-2.5 font-medium text-right">Score</th>
                <th className="px-4 py-2.5 font-medium text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {job.results.slice(0, 100).map((r) => (
                <tr key={r.username} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-white">@{r.username}</div>
                    <div className="text-[10px] text-[var(--muted)]">{r.full_name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--muted)]">{r.category ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--muted)]">{formatNumber(r.followers)}</td>
                  <td className="px-4 py-2.5">
                    {r.email.value ? (
                      <span className="text-white">{r.email.value}{r.email.valid ? " ✓" : ""}</span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.whatsapp.value ? (
                      <span className="text-white">{r.whatsapp.value}{r.whatsapp.valid_format ? " ✓" : ""}</span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={r.lead_score && r.lead_score >= 70 ? "text-[var(--success)]" : "text-white"}>
                      {r.lead_score ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--muted)]">{formatCents(r.cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {job.results.length === 0 && job.status === "running" && (
          <div className="px-5 py-8 text-center text-xs text-[var(--muted)]">
            Aguardando os primeiros resultados…
          </div>
        )}
        {job.results.length > 100 && (
          <div className="px-5 py-3 text-xs text-[var(--muted)] border-t border-[var(--border)]">
            Mostrando 100 de {job.results.length}. Exporte para ver todos.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "neutral" | "success" | "warning" | "danger" | "primary"> = {
    queued: "neutral",
    running: "primary",
    completed: "success",
    failed: "danger",
    cancelled: "neutral",
  };
  return <Badge tone={map[status] ?? "neutral"}>{status}</Badge>;
}

function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "primary";
}) {
  const color: Record<string, string> = {
    neutral: "text-white",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    primary: "text-[var(--primary)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${color[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: "danger" | "success" }) {
  const color = tone === "danger" ? "text-[var(--danger)]" : tone === "success" ? "text-[var(--success)]" : "text-white";
  return (
    <div>
      <div className="text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}
