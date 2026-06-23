import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: "grid" },
  { href: "/dashboard/new", label: "Nova extração", icon: "spark" },
  { href: "/dashboard/jobs", label: "Histórico de jobs", icon: "clock" },
  { href: "/dashboard/endpoints", label: "Endpoints RapidAPI", icon: "plug" },
  { href: "/dashboard/billing", label: "Créditos & billing", icon: "card" },
];

export function Sidebar({ active }: { active?: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-[var(--border)]">
        <Logo />
        <div className="leading-tight">
          <div className="text-sm font-semibold">InstaContact</div>
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">AI Extractor</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const isActive = active === it.href || (it.href !== "/dashboard" && active?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[var(--primary)]/15 text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-white"
              )}
            >
              <Icon name={it.icon} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <div className="rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
          <div className="font-medium text-white mb-1">Plano Pro</div>
          Créditos: 10.000/mês
        </div>
      </div>
    </aside>
  );
}

export function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-bold text-sm">
      IC
    </div>
  );
}

export function Icon({ name }: { name: string }) {
  const common = "h-4 w-4 shrink-0";
  switch (name) {
    case "grid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      );
    case "plug":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 01-10 0V8zM12 16v6" />
        </svg>
      );
    case "card":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
        </svg>
      );
    default:
      return null;
  }
}
