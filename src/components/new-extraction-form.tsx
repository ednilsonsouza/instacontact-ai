"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Label, Select, Toggle, Badge } from "@/components/ui";
import { cn, formatCents } from "@/lib/utils";

interface EndpointOpt {
  id: string;
  name: string;
  cost: number;
}

const SAMPLE_USERNAMES = [
  "@makeup_bia",
  "@studio.linda",
  "@beautycorner",
  "@pedro.personal",
  "@liftfitness",
  "@dra.helena",
  "@lima.adv",
  "@sabor.cia",
  "@clickstudio",
  "@bloom.flor",
];

export function NewExtractionForm({ endpoints }: { endpoints: EndpointOpt[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<"usernames" | "urls" | "hashtags" | "keywords">("usernames");
  const [rawItems, setRawItems] = useState("");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(["auto"]);
  const [validateEmail, setValidateEmail] = useState(true);
  const [checkWhatsapp, setCheckWhatsapp] = useState(true);
  const [leadScore, setLeadScore] = useState(true);
  const [dedup, setDedup] = useState(true);
  const [isBusiness, setIsBusiness] = useState(false);
  const [minFollowers, setMinFollowers] = useState<string>("");
  const [outputs, setOutputs] = useState<string[]>(["xlsx", "csv", "json"]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => {
    return rawItems
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [rawItems]);

  const estimatedCost = useMemo(() => {
    const endpointCount = selectedEndpoints.includes("auto") ? endpoints.length : selectedEndpoints.length;
    const avgCost = endpoints.reduce((s, e) => s + e.cost, 0) / endpoints.length;
    return Math.ceil(items.length * endpointCount * avgCost * 0.7);
  }, [items, selectedEndpoints, endpoints]);

  function toggleEndpoint(id: string) {
    setSelectedEndpoints((prev) => {
      if (id === "auto") return ["auto"];
      const next = prev.filter((p) => p !== "auto");
      return next.includes(id) ? next.filter((p) => p !== id) : [...next, id];
    });
  }

  function toggleOutput(id: string) {
    setOutputs((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function fillSample() {
    setSourceType("usernames");
    setRawItems(SAMPLE_USERNAMES.join("\n"));
    setName("Maquiadoras & Serviços SP — Lote demo");
    setTags("maquiadora, sp, demo");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Adicione ao menos um username/URL/hashtag/keyword.");
      return;
    }
    if (items.length > 10000) {
      setError("Limite máximo: 10.000 itens por job.");
      return;
    }
    if (outputs.length === 0) {
      setError("Selecione ao menos um formato de saída.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: name || `Extração ${new Date().toLocaleString("pt-BR")}`,
        source: { type: sourceType, items },
        options: {
          endpoints: selectedEndpoints,
          enrichment: { validate_email: validateEmail, check_whatsapp: checkWhatsapp, lead_score: leadScore },
          filters: { is_business: isBusiness, min_followers: minFollowers ? Number(minFollowers) : undefined },
          dedup,
          cache_ttl_hours: 24,
        },
        outputs,
        webhook_url: webhookUrl || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao criar job");
      }
      const data = await res.json();
      router.push(`/dashboard/jobs/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-32">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">1. Fonte de dados</h2>
          <button type="button" onClick={fillSample} className="text-xs text-[var(--primary)] hover:underline">
            Usar exemplo
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nome do job</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maquiadoras SP — Lote 1" />
          </div>
          <div>
            <Label>Tipo de fonte</Label>
            <Select value={sourceType} onChange={(e) => setSourceType(e.target.value as "usernames" | "urls" | "hashtags" | "keywords")}>
              <option value="usernames">Usernames</option>
              <option value="urls">URLs de perfis</option>
              <option value="hashtags">Hashtags</option>
              <option value="keywords">Palavras-chave</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label>Itens ({items.length} detectados)</Label>
          <Textarea
            value={rawItems}
            onChange={(e) => setRawItems(e.target.value)}
            placeholder={
              sourceType === "usernames"
                ? "@username1\n@username2\n..."
                : sourceType === "urls"
                ? "https://instagram.com/username1\n..."
                : "Um item por linha ou separados por vírgula"
            }
            rows={6}
          />
        </div>
        <div className="mt-4">
          <Label>Tags (separadas por vírgula)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="maquiadora, sp, lote1" />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">2. Endpoints RapidAPI</h2>
        <p className="text-xs text-[var(--muted)] mb-3">
          Selecione &quot;auto&quot; para o orquestrador escolher a melhor combinação por perfil, ou pick manual.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <EndpointChip
            id="auto"
            label="Auto (fallback inteligente)"
            cost={0}
            selected={selectedEndpoints.includes("auto")}
            onToggle={() => toggleEndpoint("auto")}
          />
          {endpoints.map((e) => (
            <EndpointChip
              key={e.id}
              id={e.id}
              label={e.name}
              cost={e.cost}
              selected={selectedEndpoints.includes(e.id)}
              onToggle={() => toggleEndpoint(e.id)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">3. Enriquecimento & filtros</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Toggle checked={validateEmail} onChange={setValidateEmail} label="Validar e-mail" />
            <Toggle checked={checkWhatsapp} onChange={setCheckWhatsapp} label="Detectar WhatsApp (wa.me / bio)" />
            <Toggle checked={leadScore} onChange={setLeadScore} label="Calcular lead score (0–100)" />
            <Toggle checked={dedup} onChange={setDedup} label="Dedup por username / e-mail / WhatsApp" />
          </div>
          <div className="space-y-4">
            <Toggle checked={isBusiness} onChange={setIsBusiness} label="Apenas contas Business" />
            <div>
              <Label>Seguidores mínimos</Label>
              <Input
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                placeholder="Ex: 1000"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">4. Saídas</h2>
        <div className="flex flex-wrap gap-2">
          {["xlsx", "csv", "json", "google_sheets", "notion", "webhook"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggleOutput(o)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                outputs.includes(o)
                  ? "border-[var(--primary)] bg-[var(--primary)]/15 text-white"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-white"
              )}
            >
              {o}
            </button>
          ))}
        </div>
        {outputs.includes("webhook") && (
          <div className="mt-4">
            <Label>Webhook URL (POST assinado)</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.example.com/instacontact"
            />
          </div>
        )}
      </Card>

      <Card className="sticky bottom-4 z-30 bg-[var(--surface-2)] border-[var(--primary)]/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <div className="text-[var(--muted)] text-xs">Custo estimado</div>
            <div className="text-xl font-semibold text-white">{formatCents(estimatedCost)}</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">
              {items.length} itens · {selectedEndpoints.includes("auto") ? endpoints.length : selectedEndpoints.length} endpoints
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Iniciando…" : "Iniciar extração"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function EndpointChip({
  label,
  cost,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  cost: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-white"
          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-white"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border",
            selected ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]"
          )}
        >
          {selected && (
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {cost > 0 && <Badge tone="neutral">{formatCents(cost)}/req</Badge>}
    </button>
  );
}
