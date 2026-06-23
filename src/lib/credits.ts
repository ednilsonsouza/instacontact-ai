import type { Credits } from "@/lib/types";

const creditsStore = new Map<string, Credits>();

export function getCredits(userId = "demo_user"): Credits {
  let c = creditsStore.get(userId);
  if (!c) {
    c = { user_id: userId, total: 10000, used: 0, plan: "Pro" };
    creditsStore.set(userId, c);
  }
  return c;
}

export function consumeCredits(userId: string, costCents: number): Credits {
  const c = getCredits(userId);
  c.used = Math.min(c.total, c.used + costCents);
  return c;
}

export function setPlan(userId: string, plan: string, total: number): Credits {
  const c = getCredits(userId);
  c.plan = plan;
  c.total = total;
  return c;
}
