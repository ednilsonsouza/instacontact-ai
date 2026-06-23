const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_BR_RE = /(?:\+?55\s?)?(?:\(?0?\d{2}\)?\s?)?(?:9\s?)?(\d{4,5}[-\s]?\d{4})/g;
const PHONE_INT_RE = /\+\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g;
const WA_LINK_RE = /wa\.me\/(\d+)/gi;
const WA_TEXT_RE = /(?:whatsapp|whats\s*app|wpp|zap)[:\s]+(\+?\d[\d\s\-()]{8,})/gi;

export function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_RE) ?? [];
  return unique(matches).filter((e) => !isDisposable(e) && !isImageFile(e));
}

export function extractPhones(text: string): { phone: string; whatsapp: string | null }[] {
  const results: { phone: string; whatsapp: string | null }[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(WA_LINK_RE)) {
    const digits = m[1];
    if (digits.length >= 10 && !seen.has(digits)) {
      seen.add(digits);
      results.push({ phone: digits, whatsapp: digits });
    }
  }

  for (const m of text.matchAll(WA_TEXT_RE)) {
    const digits = m[1].replace(/\D/g, "");
    if (digits.length >= 10 && !seen.has(digits)) {
      seen.add(digits);
      results.push({ phone: digits, whatsapp: digits });
    }
  }

  for (const m of text.matchAll(PHONE_INT_RE)) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 10 && !seen.has(digits)) {
      seen.add(digits);
      results.push({ phone: digits, whatsapp: null });
    }
  }

  for (const m of text.matchAll(PHONE_BR_RE)) {
    const full = m[0].replace(/\D/g, "");
    if (full.length >= 10 && !seen.has(full)) {
      seen.add(full);
      results.push({ phone: full, whatsapp: null });
    }
  }

  return results;
}

export function extractWhatsApp(text: string): string | null {
  for (const m of text.matchAll(WA_LINK_RE)) {
    return m[1];
  }
  for (const m of text.matchAll(WA_TEXT_RE)) {
    const digits = m[1].replace(/\D/g, "");
    if (digits.length >= 10) return digits;
  }
  return null;
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

const DISPOSABLE = ["example.com", "test.com", "sentry.io", "w3.org", "schema.org", "png", "jpg", "jpeg", "gif", "svg", "css", "js"];
function isDisposable(e: string): boolean {
  return DISPOSABLE.some((d) => e.toLowerCase().endsWith(d) || e.toLowerCase().includes(d));
}

function isImageFile(e: string): boolean {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp)$/i.test(e);
}

export function normalizePhone(digits: string, country = "BR"): string {
  if (country === "BR" && digits.length === 10) {
    return "55" + digits;
  }
  if (country === "BR" && digits.length === 11) {
    return "55" + digits;
  }
  return digits;
}

export function toWaMe(digits: string): string {
  return `https://wa.me/${digits}`;
}
