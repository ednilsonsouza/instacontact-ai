"use client";

import { useSyncExternalStore, useState } from "react";

const STORAGE_KEY = "ic_lgpd_accepted";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export function LgpdBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4 pointer-events-none">
      <div className="mx-auto max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-2xl pointer-events-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)] leading-relaxed max-w-3xl">
            <strong className="text-white">Conformidade LGPD &amp; Termos Instagram.</strong> O InstaContact
            AI coleta apenas <strong>dados públicos</strong> via APIs do RapidAPI. O uso dos dados é de
            responsabilidade do usuário final, conforme a LGPD e os Termos da plataforma de origem. Ao
            continuar, você declara conhecer e aceitar estas condições.
          </p>
          <button
            onClick={accept}
            className="shrink-0 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
