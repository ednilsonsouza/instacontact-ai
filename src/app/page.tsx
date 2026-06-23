import Link from "next/link";
import { Logo } from "@/components/sidebar";

const features = [
  {
    title: "Orquestração multi-API",
    desc: "Testa automaticamente múltiplas APIs de Instagram do RapidAPI por perfil e escolhe a que retorna mais contatos. Fallback inteligente com circuit breaker.",
  },
  {
    title: "Extração completa",
    desc: "E-mail público, WhatsApp, telefone, bio, categoria, seguidores, link na bio, conta Business e mais — em uma única execução.",
  },
  {
    title: "Enriquecimento & validação",
    desc: "Validação sintática de e-mail, detecção de WhatsApp (wa.me, bio), scoring de qualidade do lead de 0 a 100.",
  },
  {
    title: "Export multiformato",
    desc: "Excel, CSV, JSON, Google Sheets, Notion e Webhook assinado. Pronto para Make, n8n, Zapier e CRMs.",
  },
  {
    title: "Dashboard de custos",
    desc: "Acompanhe em tempo real créditos consumidos, custo por lead, taxa de sucesso e latência por endpoint RapidAPI.",
  },
  {
    title: "Anti-ban & conformidade",
    desc: "Rate limiting por endpoint, rotação de provedores, cache, banner LGPD e avisos claros de Termos do Instagram.",
  },
];

const metrics = [
  { value: "≥ 40%", label: "Taxa de extração de e-mail" },
  { value: "≥ 28%", label: "Taxa de extração de WhatsApp" },
  { value: "< 6s", label: "Tempo médio por perfil" },
  { value: "5+", label: "Endpoints orquestrados" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Logo />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">InstaContact AI</div>
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                Instagram Contact Extractor
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-[var(--muted)] hover:text-white">Recursos</a>
            <a href="#metrics" className="text-[var(--muted)] hover:text-white">Métricas</a>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white font-medium hover:opacity-90"
            >
              Abrir painel
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              Powered by RapidAPI Hub · Multi-endpoint orchestration
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-white">
              Extraia e-mail e WhatsApp de perfis Instagram Business{" "}
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                em escala
              </span>
            </h1>
            <p className="mt-6 text-lg text-[var(--muted)] leading-relaxed">
              Orquestração inteligente de múltiplas APIs do RapidAPI com fallback automático,
              enriquecimento, validação de leads e export para Excel, Sheets, Notion, webhook e CRMs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/new"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--primary)] px-6 text-sm font-medium text-white hover:opacity-90"
              >
                Iniciar extração
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-medium text-white hover:border-[var(--primary)]"
              >
                Ver dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px md:grid-cols-4 px-6">
          {metrics.map((m) => (
            <div key={m.label} className="py-10 text-center">
              <div className="text-3xl font-semibold text-white">{m.value}</div>
              <div className="mt-2 text-xs text-[var(--muted)] uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold text-white text-center">Tudo o que você precisa para lead generation no Instagram</h2>
        <p className="mt-3 text-center text-[var(--muted)]">Do input ao CRM, em uma única plataforma.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--primary)] transition-colors"
            >
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">Pronto para construir listas qualificadas?</h2>
          <p className="mt-3 text-[var(--muted)]">Comece agora — sem cartão na fase beta.</p>
          <Link
            href="/dashboard/new"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[var(--primary)] px-6 text-sm font-medium text-white hover:opacity-90"
          >
            Criar primeira extração
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        InstaContact AI · Uso responsável conforme LGPD e Termos do Instagram · dados públicos apenas.
      </footer>
    </div>
  );
}
