import { LeadSearch } from "@/components/lead-search";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-bold text-sm">
              LF
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">LeadFinder</div>
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Web Contact Extractor</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Busca em tempo real
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Encontre <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">contatos de profissionais</span> na web
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Informe a profissão e estado. Buscamos e-mails e telefones em fontes públicas — Instagram, LinkedIn, Google e diretórios.
          </p>
        </div>

        <LeadSearch />
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        LeadFinder · Apenas dados públicos · Uso responsável conforme LGPD
      </footer>
    </div>
  );
}
