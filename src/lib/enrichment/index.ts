import type { ContactField, ProfileResult, WhatsAppField } from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const WA_PATTERNS = [
  /wa\.me\/(\d+)/i,
  /(?:whatsapp|whats\s*app|wpp)[:\s]+(\+?\d[\d\s\-()]{7,})/i,
  /(?:tel[:\s]|telefone[:\s]|fone[:\s]|contato[:\s])\+?(\d[\d\s\-()]{7,})/i,
];

export function validateEmail(email: string | null): { valid: boolean; confidence: number } {
  if (!email) return { valid: false, confidence: 0 };
  const valid = EMAIL_REGEX.test(email);
  const disposable = /mailinator|guerrilla|tempmail|10minute/i.test(email);
  const confidence = valid ? (disposable ? 0.4 : 0.9) : 0.1;
  return { valid, confidence };
}

export function extractWhatsApp(bio: string | null, phone: string | null): {
  value: string | null;
  wa_me: string | null;
  country: string | null;
} {
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) {
      return { value: digits, wa_me: `https://wa.me/${digits}`, country: detectCountry(digits) };
    }
  }
  if (!bio) return { value: null, wa_me: null, country: null };
  for (const pat of WA_PATTERNS) {
    const m = bio.match(pat);
    if (m) {
      const digits = m[1].replace(/\D/g, "");
      if (digits.length >= 10) {
        return { value: digits, wa_me: `https://wa.me/${digits}`, country: detectCountry(digits) };
      }
    }
  }
  return { value: null, wa_me: null, country: null };
}

function detectCountry(digits: string): string | null {
  if (digits.startsWith("55")) return "BR";
  if (digits.startsWith("1")) return "US";
  if (digits.startsWith("351")) return "PT";
  return null;
}

export function computeLeadScore(p: {
  is_business: boolean;
  followers: number | null;
  email: ContactField;
  whatsapp: WhatsAppField;
  bio: string | null;
  category: string | null;
}): number {
  let score = 0;
  if (p.is_business) score += 20;
  if (p.email.valid) score += 30;
  if (p.whatsapp.valid_format) score += 30;
  if ((p.followers ?? 0) >= 1000) score += 10;
  if ((p.followers ?? 0) >= 10000) score += 5;
  if (p.category) score += 5;
  if (p.bio && p.bio.length > 30) score += 5;
  return Math.min(100, score);
}

export function enrichProfile(p: ProfileResult, opts: {
  validate_email: boolean;
  check_whatsapp: boolean;
  lead_score: boolean;
}): ProfileResult {
  let email = p.email;
  if (opts.validate_email) {
    const v = validateEmail(p.email.value);
    email = { ...p.email, valid: v.valid, confidence: v.confidence };
  }
  let whatsapp = p.whatsapp;
  if (opts.check_whatsapp) {
    const wa = extractWhatsApp(p.bio, p.whatsapp.value);
    whatsapp = {
      value: wa.value ?? p.whatsapp.value,
      wa_me: wa.wa_me ?? p.whatsapp.wa_me,
      source: wa.value ? "bio_regex" : p.whatsapp.source,
      valid_format: !!wa.value,
      country: wa.country ?? p.whatsapp.country,
    };
  }
  let lead_score = p.lead_score;
  if (opts.lead_score) {
    lead_score = computeLeadScore({ ...p, email, whatsapp });
  }
  return { ...p, email, whatsapp, lead_score };
}
