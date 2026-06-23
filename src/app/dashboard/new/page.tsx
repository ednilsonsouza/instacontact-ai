import { NewExtractionForm } from "@/components/new-extraction-form";
import { Card } from "@/components/ui";
import { ENDPOINT_CATALOG } from "@/lib/rapidapi/catalog";
import { getCredits } from "@/lib/credits";
import { formatCents, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function NewExtractionPage() {
  const credits = getCredits();
  const remaining = credits.total - credits.used;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Nova extração</h1>
        <p className="text-sm text-[var(--muted)]">
          Configure a fonte, os endpoints e os formatos de saída. O custo é estimado antes da execução.
        </p>
      </div>

      <Card className="bg-[var(--surface-2)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--muted)]">Créditos restantes</span>
          <span className="text-white font-medium">{formatNumber(remaining)} ({formatCents(remaining)})</span>
        </div>
      </Card>

      <NewExtractionForm endpoints={ENDPOINT_CATALOG.map((e) => ({ id: e.id, name: e.name, cost: e.cost_per_request_cents }))} />
    </div>
  );
}
