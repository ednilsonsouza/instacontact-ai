import { Card, Button, Badge } from "@/components/ui";
import { getCredits } from "@/lib/credits";
import { formatCents, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLANS = [
  { id: "free", name: "Free", credits: 1000, price: 0, features: ["1.000 créditos/mês", "2 endpoints", "Export CSV/JSON"] },
  { id: "pro", name: "Pro", credits: 10000, price: 49, features: ["10.000 créditos/mês", "Todos endpoints", "Fallback inteligente", "Excel/Sheets/Notion/Webhook", "Dashboard de custos"] },
  { id: "business", name: "Business", credits: 50000, price: 199, features: ["50.000 créditos/mês", "Todos endpoints + proxy", "API pública", "Integrações CRM", "Suporte prioritário"] },
];

export default function BillingPage() {
  const credits = getCredits();
  const remaining = credits.total - credits.used;
  const usedPct = credits.total ? (credits.used / credits.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Créditos & billing</h1>
        <p className="text-sm text-[var(--muted)]">Acompanhe consumo e gerencie seu plano.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Créditos restantes</div>
          <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(remaining)}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">de {formatNumber(credits.total)}</div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className={`h-full rounded-full ${usedPct > 90 ? "bg-[var(--danger)]" : usedPct > 75 ? "bg-[var(--warning)]" : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"}`}
              style={{ width: `${Math.min(100, usedPct)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">
            {usedPct.toFixed(0)}% consumido · {formatCents(credits.used)}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Plano atual</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-semibold text-white">{credits.plan}</span>
            <Badge tone="primary">ativo</Badge>
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {formatNumber(credits.total)} créditos/mês
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm">Top-up</Button>
            <Button variant="ghost" size="sm">Cancelar</Button>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Alertas</div>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <span className={`h-1.5 w-1.5 rounded-full ${usedPct > 80 ? "bg-[var(--warning)]" : "bg-[var(--success)]"}`} />
              Alerta em 80% dos créditos
            </div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <span className={`h-1.5 w-1.5 rounded-full ${usedPct > 95 ? "bg-[var(--danger)]" : "bg-[var(--success)]"}`} />
              Bloqueio em 100%
            </div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              Circuit breaker ativo
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">Planos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.name === credits.plan;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-5 ${
                  isCurrent ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] bg-[var(--surface-2)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{p.name}</h3>
                  {isCurrent && <Badge tone="primary">atual</Badge>}
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  ${p.price}<span className="text-sm text-[var(--muted)] font-normal">/mês</span>
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">{formatNumber(p.credits)} créditos/mês</div>
                <ul className="mt-4 space-y-1.5 text-xs text-[var(--muted)]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[var(--success)] mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "secondary" : "primary"}
                  size="sm"
                  className="mt-5 w-full"
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plano atual" : `Upgrade para ${p.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-2">Conformidade</h2>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          O InstaContact AI coleta apenas dados públicos via APIs do RapidAPI. O uso dos dados é de
          responsabilidade do usuário final, conforme a LGPD (Lei 13.709/2018) e os Termos do Instagram.
          Não armazenamos credenciais, não automatizamos login e não enviamos campanhas. A plataforma
          oferece apenas extração, enriquecimento e exportação.
        </p>
      </Card>
    </div>
  );
}
