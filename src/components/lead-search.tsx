"use client";

import { useState, useRef, useCallback } from "react";
import type { Lead, SearchProgress } from "@/lib/types";

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const SUGGESTIONS = [
  "advogado", "médico", "dentista", "personal trainer", "maquiadora",
  "arquiteto", "engenheiro", "contador", "psicólogo", "fisioterapeuta",
  "nutricionista", "fotógrafo", "corretor de imóveis", "eletricista",
  "encanador", "jardineiro", "chef de cozinha", "cabeleireiro",
];

export function LeadSearch() {
  const [profession, setProfession] = useState("");
  const [state, setState] = useState("SP");
  const [searching, setSearching] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [filterEmail, setFilterEmail] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    if (!profession.trim()) return;
    setSearching(true);
    setLeads([]);
    setProgress({ total_found: 0, with_email: 0, with_phone: 0, sources_tried: [], status: "searching", current_source: "Iniciando..." });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profession: profession.trim(), state: state.trim(), max: 30 }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setProgress({ total_found: 0, with_email: 0, with_phone: 0, sources_tried: [], status: "error", current_source: "Erro ao buscar" });
        setSearching(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (eventType === "lead") {
                setLeads((prev) => [...prev, parsed as Lead]);
              } else if (eventType === "progress") {
                setProgress(parsed as SearchProgress);
              } else if (eventType === "complete") {
                setSearching(false);
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setProgress({ total_found: 0, with_email: 0, with_phone: 0, sources_tried: [], status: "error", current_source: "Erro de conexão" });
      }
    }
    setSearching(false);
  }, [profession, state]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setSearching(false);
  }, []);

  const filtered = leads.filter((l) => {
    if (filterEmail && !l.email) return false;
    if (filterPhone && !l.phone && !l.whatsapp) return false;
    return true;
  });

  function exportCsv() {
    fetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leads: filtered, format: "csv" }),
    })
      .then((r) => r.blob())
      .then((b) => download(b, "leads.csv"));
  }

  function exportJson() {
    fetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leads: filtered, format: "json" }),
    })
      .then((r) => r.blob())
      .then((b) => download(b, "leads.json"));
  }

  return (
    <div className="space-y-6">
      <SearchBar
        profession={profession}
        setProfession={setProfession}
        state={state}
        setState={setState}
        searching={searching}
        onStart={start}
        onStop={stop}
      />

      {progress && <ProgressBar progress={progress} leadsCount={leads.length} />}

      {leads.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <FilterChip active={filterEmail} onClick={() => setFilterEmail(!filterEmail)} label={`Com e-mail (${leads.filter((l) => l.email).length})`} />
            <FilterChip active={filterPhone} onClick={() => setFilterPhone(!filterPhone)} label={`Com telefone (${leads.filter((l) => l.phone || l.whatsapp).length})`} />
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={exportCsv} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-white hover:border-[var(--primary)]">Exportar CSV</button>
            <button onClick={exportJson} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-white hover:border-[var(--primary)]">Exportar JSON</button>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <ResultsGrid leads={filtered} />
      ) : searching ? (
        <SkeletonGrid />
      ) : progress?.status === "done" && leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-20 text-center">
          <p className="text-sm text-[var(--muted)]">Nenhum contato encontrado para esta busca.</p>
          <p className="text-xs text-[var(--muted)] mt-1">Tente outra profissão ou estado.</p>
        </div>
      ) : (
        <EmptyState onPick={(p) => setProfession(p)} suggestions={SUGGESTIONS} />
      )}
    </div>
  );
}

function SearchBar({
  profession, setProfession, state, setState, searching, onStart, onStop,
}: {
  profession: string; setProfession: (v: string) => void;
  state: string; setState: (v: string) => void;
  searching: boolean; onStart: () => void; onStop: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs text-[var(--muted)] mb-1.5">Profissão</label>
          <input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !searching && onStart()}
            placeholder="Ex: advogado, personal trainer, maquiadora..."
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div className="sm:w-32">
          <label className="block text-xs text-[var(--muted)] mb-1.5">Estado</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
          >
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={searching ? onStop : onStart}
          disabled={!profession.trim() && !searching}
          className={`h-12 px-6 rounded-xl text-sm font-medium transition-colors ${
            searching
              ? "bg-[var(--danger)] text-white hover:opacity-90"
              : "bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40"
          }`}
        >
          {searching ? "Parar" : "Buscar contatos"}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ progress, leadsCount }: { progress: SearchProgress; leadsCount: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {progress.status === "searching" && (
            <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] pulse-dot" />
          )}
          <span className="text-sm text-white">
            {progress.current_source ?? "Buscando..."}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="text-white font-medium">{leadsCount} encontrados</span>
          <span>{progress.with_email} e-mails</span>
          <span>{progress.with_phone} telefones</span>
        </div>
      </div>
      {progress.sources_tried.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {progress.sources_tried.map((s) => (
            <span key={s} className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--muted)]">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsGrid({ leads }: { leads: Lead[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="slide-up rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]/50 transition-colors">
      <div className="flex items-start gap-3">
        {lead.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lead.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-medium text-[var(--muted)]">
            {(lead.name ?? lead.profession ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate">{lead.name ?? lead.profession}</div>
          <div className="text-xs text-[var(--muted)]">{lead.profession} · {lead.location}</div>
        </div>
        <span className="text-[10px] rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--muted)]">{lead.source}</span>
      </div>

      <div className="mt-3 space-y-1.5">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs text-[var(--primary)] hover:underline">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9 6 9-6M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /></svg>
            <span className="truncate">{lead.email}</span>
          </a>
        )}
        {lead.phone && (
          <a href={lead.whatsapp ? `https://wa.me/${lead.whatsapp}` : `tel:${lead.phone}`} target={lead.whatsapp ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[var(--success)] hover:underline">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
            <span className="truncate">{lead.phone}</span>
            {lead.whatsapp && <span className="rounded bg-[var(--success)]/15 px-1 text-[9px]">WhatsApp</span>}
          </a>
        )}
      </div>

      {lead.bio && (
        <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">{lead.bio}</p>
      )}

      <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-[10px] text-[var(--muted)] hover:text-[var(--primary)] truncate">
        {lead.source_url}
      </a>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-[var(--surface-2)] shimmer" />
              <div className="h-2 w-1/3 rounded bg-[var(--surface-2)] shimmer" />
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded bg-[var(--surface-2)] shimmer" />
          <div className="mt-2 h-2 w-3/4 rounded bg-[var(--surface-2)] shimmer" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onPick, suggestions }: { onPick: (p: string) => void; suggestions: string[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h2 className="text-lg font-medium text-white">Busque contatos na web</h2>
      <p className="text-sm text-[var(--muted)] mt-1">Digite uma profissão e estado para encontrar e-mails e telefones públicos.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--primary)] hover:text-white transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-white"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
