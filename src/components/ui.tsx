import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5", className)}>
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  onClick,
  children,
}: {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--primary)] text-white hover:opacity-90",
    secondary: "bg-[var(--surface-2)] text-white border border-[var(--border)] hover:border-[var(--primary)]",
    ghost: "text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]",
    danger: "bg-[var(--danger)] text-white hover:opacity-90",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-sm",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]",
    success: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
    warning: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30",
    danger: "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30",
    primary: "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-white focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-xs font-medium text-[var(--muted)] mb-1.5", className)}>
      {children}
    </label>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const toneColor: Record<string, string> = {
    neutral: "text-white",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    danger: "text-[var(--danger)]",
    primary: "text-[var(--primary)]",
  };
  return (
    <Card className="p-4">
      <div className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold", toneColor[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </Card>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[var(--primary)]" : "bg-[var(--surface-2)] border border-[var(--border)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="text-sm text-white">{label}</span>
    </label>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16 text-center">
      <div className="text-sm font-medium text-white">{title}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}
