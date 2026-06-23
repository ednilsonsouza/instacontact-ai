import Link from "next/link";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
import { listJobs } from "@/lib/store";
import { formatCents, formatNumber, relativeTime, formatPct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  const jobs = listJobs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Histórico de jobs</h1>
          <p className="text-sm text-[var(--muted)]">Todas as extrações executadas.</p>
        </div>
        <Link href="/dashboard/new">
          <Button>Nova extração</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="Nenhum job executado" hint="Crie sua primeira extração para vê-la aqui." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium text-right">Perfis</th>
                  <th className="px-4 py-3 font-medium text-right">E-mails</th>
                  <th className="px-4 py-3 font-medium text-right">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-right">Custo</th>
                  <th className="px-4 py-3 font-medium">Criado</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${j.id}`} className="font-medium text-white hover:text-[var(--primary)]">
                        {j.name}
                      </Link>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        {j.input.tags.length > 0 ? j.input.tags.map((t) => `#${t}`).join(" ") : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--muted)]">
                      {j.progress.processed}/{j.progress.total}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white">{formatNumber(j.progress.emails_found)}</span>
                      <span className="text-[var(--muted)] text-xs ml-1">
                        ({formatPct(j.progress.emails_found, j.progress.processed)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white">{formatNumber(j.progress.whatsapps_found)}</span>
                      <span className="text-[var(--muted)] text-xs ml-1">
                        ({formatPct(j.progress.whatsapps_found, j.progress.processed)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--muted)]">{formatCents(j.cost_cents)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{relativeTime(j.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={j.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
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
