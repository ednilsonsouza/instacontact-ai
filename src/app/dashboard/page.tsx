import Link from "next/link";
import { Card, StatCard, Badge, Button, EmptyState } from "@/components/ui";
import { listJobs, getEndpointStats } from "@/lib/store";
import { getCredits } from "@/lib/credits";
import { ENDPOINT_CATALOG } from "@/lib/rapidapi/catalog";
import { formatCents, formatNumber, relativeTime, formatPct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const jobs = listJobs();
  const stats = getEndpointStats();
  const credits = getCredits();

  const totalProcessed = jobs.reduce((s, j) => s + j.progress.processed, 0);
  const totalEmails = jobs.reduce((s, j) => s + j.progress.emails_found, 0);
  const totalWhatsapps = jobs.reduce((s, j) => s + j.progress.whatsapps_found, 0);
  const totalCost = jobs.reduce((s, j) => s + j.cost_cents, 0);
  const emailRate = totalProcessed ? (totalEmails / totalProcessed) * 100 : 0;
  const waRate = totalProcessed ? (totalWhatsapps / totalProcessed) * 100 : 0;
  const remainingCredits = credits.total - credits.used;
  const creditsPct = credits.total ? (credits.used / credits.total) * 100 : 0;

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Visão geral</h1>
          <p className="text-sm text-[var(--muted)]">Performance das extrações e custos em tempo real.</p>
        </div>
        <Link href="/dashboard/new">
          <Button>Nova extração</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Extrações"
          value={jobs.length}
          hint={`${formatNumber(totalProcessed)} perfis processados`}
        />
        <StatCard
          label="Taxa de e-mail"
          value={`${emailRate.toFixed(1)}%`}
          hint={`${formatNumber(totalEmails)} e-mails encontrados`}
          tone={emailRate >= 40 ? "success" : "warning"}
        />
        <StatCard
          label="Taxa de WhatsApp"
          value={`${waRate.toFixed(1)}%`}
          hint={`${formatNumber(totalWhatsapps)} whatsapps encontrados`}
          tone={waRate >= 28 ? "success" : "warning"}
        />
        <StatCard
          label="Custo total"
          value={formatCents(totalCost)}
          hint={formatPct(credits.used, credits.total) + " dos créditos"}
          tone="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Jobs recentes</h2>
            <Link href="/dashboard/jobs" className="text-xs text-[var(--primary)] hover:underline">
              Ver todos
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <EmptyState
              title="Nenhuma extração ainda"
              hint="Crie sua primeira extração para ver os resultados aqui."
            />
          ) : (
            <div className="space-y-2">
              {recentJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/dashboard/jobs/${j.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 hover:border-[var(--primary)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{j.name}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {j.progress.processed}/{j.progress.total} · {relativeTime(j.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)]">{formatCents(j.cost_cents)}</span>
                    <StatusBadge status={j.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Créditos</h2>
          <div className="text-3xl font-semibold text-white">{formatNumber(remainingCredits)}</div>
          <div className="text-xs text-[var(--muted)] mt-1">restantes de {formatNumber(credits.total)}</div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
              style={{ width: `${Math.min(100, creditsPct)}%` }}
            />
          </div>
          <div className="mt-4 text-xs text-[var(--muted)]">
            Plano <span className="text-white font-medium">{credits.plan}</span> · {formatCents(credits.used)} consumidos
          </div>
          <Link href="/dashboard/billing" className="mt-4 block">
            <Button variant="secondary" size="sm" className="w-full">Gerenciar plano</Button>
          </Link>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">Performance por endpoint RapidAPI</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="pb-2 font-medium">Endpoint</th>
                <th className="pb-2 font-medium text-right">Req</th>
                <th className="pb-2 font-medium text-right">Sucesso</th>
                <th className="pb-2 font-medium text-right">Contatos</th>
                <th className="pb-2 font-medium text-right">Latência</th>
                <th className="pb-2 font-medium text-right">Custo</th>
                <th className="pb-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINT_CATALOG.map((e) => {
                const s = stats.find((x) => x.endpoint === e.id)!;
                const successRate = s.requests ? (s.successes / s.requests) * 100 : 0;
                return (
                  <tr key={e.id} className="border-b border-[var(--border)]/50">
                    <td className="py-2.5">
                      <div className="font-medium text-white">{e.name}</div>
                      <div className="text-[10px] text-[var(--muted)]">{e.host}</div>
                    </td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{s.requests}</td>
                    <td className="py-2.5 text-right">
                      <span className={successRate >= 80 ? "text-[var(--success)]" : successRate >= 50 ? "text-[var(--warning)]" : "text-[var(--danger)]"}>
                        {successRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{s.contacts_found}</td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{s.avg_latency_ms || 0}ms</td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{formatCents(s.cost_cents)}</td>
                    <td className="py-2.5 text-center">
                      {s.circuit_open ? <Badge tone="danger">Circuit</Badge> : <Badge tone="success">OK</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
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
