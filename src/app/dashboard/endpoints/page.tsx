import { Card, Badge } from "@/components/ui";
import { ENDPOINT_CATALOG } from "@/lib/rapidapi/catalog";
import { getEndpointStats } from "@/lib/store";
import { formatCents, formatPct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function EndpointsPage() {
  const stats = getEndpointStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Endpoints RapidAPI</h1>
          <p className="text-sm text-[var(--muted)]">
            Catálogo orquestrado, performance e custos por endpoint.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ENDPOINT_CATALOG.map((e) => {
          const s = stats.find((x) => x.endpoint === e.id)!;
          const successRate = s.requests ? (s.successes / s.requests) * 100 : 0;
          const contactRate = s.requests ? (s.contacts_found / s.requests) * 100 : 0;
          const costPerLead = s.contacts_found ? s.cost_cents / s.contacts_found : 0;
          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">{e.name}</h2>
                  <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">{e.host}</div>
                </div>
                {s.circuit_open ? <Badge tone="danger">Circuit open</Badge> : <Badge tone="success">Ativo</Badge>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.capabilities.map((c) => (
                  <Badge key={c} tone="primary">{c}</Badge>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <Cell label="Req" value={String(s.requests)} />
                <Cell label="Sucesso" value={`${successRate.toFixed(0)}%`} tone={successRate >= 80 ? "success" : "warning"} />
                <Cell label="Contatos" value={`${contactRate.toFixed(0)}%`} />
                <Cell label="Latência" value={`${s.avg_latency_ms}ms`} />
                <Cell label="Custo/req" value={formatCents(e.cost_per_request_cents)} />
                <Cell label="Custo total" value={formatCents(s.cost_cents)} />
                <Cell label="Custo/lead" value={costPerLead ? formatCents(costPerLead) : "—"} />
                <Cell label="Rate limit" value={`${e.rate_limit_per_min}/min`} />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">
                  Prioridade {e.priority} · {formatPct(s.successes, s.requests)} sucesso
                </span>
                <span className="text-[var(--muted)]">{formatPct(s.contacts_found, s.requests)} contatos</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-3">Estratégia de fallback</h2>
        <ol className="space-y-2 text-xs text-[var(--muted)] list-decimal list-inside">
          <li>Cada perfil é enviado ao endpoint primário (menor prioridade) da categoria.</li>
          <li>Se faltar e-mail ou WhatsApp, o orquestrador tenta o próximo endpoint.</li>
          <li>Resultados são mergeados campo a campo, priorizando a fonte com maior score histórico.</li>
          <li>Endpoint com &gt;30% de falhas em 5 min é pausado por 10 min (circuit breaker).</li>
          <li>Se dois endpoints retornam igual, o mais barato é preferido.</li>
          <li>Cache de 24h evita requisições repetidas ao mesmo perfil.</li>
        </ol>
      </Card>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "text-[var(--success)]" : tone === "warning" ? "text-[var(--warning)]" : "text-white";
  return (
    <div>
      <div className="text-[var(--muted)]">{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  );
}
