/** Plan, trial, and price settings. Change these without touching payment code. Admin can override the country amounts. */

export type PlanId = "starter" | "pro" | "plus" | "elite";

export type PlanDef = {
  id: PlanId;
  name: string;
  multiplier: number;
  badge: string | null;
  boostsPerYear: number;
  features: string[];
};

export const PLAN_CONFIG = {
  trialDays: 30,
  yearDays: 365,
  reminderDays: [7, 3, 1],
  languages: ["en", "fr"] as const,
  /** First plan uses starter. Later plans start at higherStart and rise by step. */
  photoRule: { starter: 3, higherStart: 10, step: 5 },
  plans: [
    {
      id: "starter",
      name: "Starter",
      multiplier: 1,
      badge: null,
      boostsPerYear: 0,
      features: ["Profile", "3 photos", "Contact buttons", "Search listing", "Basic stats"],
    },
    {
      id: "pro",
      name: "Pro",
      multiplier: 2,
      badge: "Pro",
      boostsPerYear: 0,
      features: ["10 photos", "Click and contact report", "Personal link and QR card", "Pro badge"],
    },
    {
      id: "plus",
      name: "Plus",
      multiplier: 3,
      badge: "Plus",
      boostsPerYear: 1,
      features: ["Everything in Pro", "15 photos", "One free 7-day Boost each year"],
    },
    {
      id: "elite",
      name: "Elite",
      multiplier: 4,
      badge: "Elite",
      boostsPerYear: 3,
      features: ["Everything in Plus", "20 photos", "Three free 7-day Boosts each year"],
    },
  ] satisfies PlanDef[],
  /** Yearly base price in major units. Starter is 1×, Pro 2×, Plus 3×, Elite 4×. */
  bases: {
    GH: { currency: "GHS", major: 10, subunit: 100 },
    CI: { currency: "XOF", major: 500, subunit: 1 },
    NG: { currency: "NGN", major: 1000, subunit: 100 },
    ZA: { currency: "ZAR", major: 20, subunit: 100 },
    ZM: { currency: "ZMW", major: 25, subunit: 100 },
    KE: { currency: "KES", major: 150, subunit: 100 },
  } as Record<string, { currency: string; major: number; subunit: number }>,
  boost: {
    days: 7,
    majors: { GH: 5, CI: 250, NG: 500, ZA: 10, ZM: 15, KE: 80 } as Record<string, number>,
  },
  hirer: {
    majors: { GH: 15, CI: 750, NG: 1500, ZA: 30, ZM: 40, KE: 200 } as Record<string, number>,
  },
};

export type PriceOverrides = {
  bases?: Record<string, number>;
  boost?: Record<string, number>;
  hirer?: Record<string, number>;
};

export function photosForPlan(planId: string): number {
  const index = PLAN_CONFIG.plans.findIndex((plan) => plan.id === planId);
  const place = index < 0 ? 0 : index;
  if (place === 0) return PLAN_CONFIG.photoRule.starter;
  return PLAN_CONFIG.photoRule.higherStart + (place - 1) * PLAN_CONFIG.photoRule.step;
}

export function maxStoredPhotos(): number {
  return Math.max(...PLAN_CONFIG.plans.map((plan) => photosForPlan(plan.id)));
}

export function planById(planId: string): PlanDef {
  return PLAN_CONFIG.plans.find((plan) => plan.id === planId) ?? PLAN_CONFIG.plans[0];
}

export function baseMajor(country: string, overrides?: PriceOverrides): number {
  const code = country.toUpperCase();
  const custom = overrides?.bases?.[code];
  if (typeof custom === "number" && custom > 0) return custom;
  return PLAN_CONFIG.bases[code]?.major ?? PLAN_CONFIG.bases.GH.major;
}

export function money(country: string, major: number): { currency: string; minor: number; label: string } {
  const code = country.toUpperCase();
  const spec = PLAN_CONFIG.bases[code] ?? PLAN_CONFIG.bases.GH;
  const minor = Math.round(major * spec.subunit);
  const label = Number.isInteger(major) ? `${spec.currency} ${major}` : `${spec.currency} ${major.toFixed(2)}`;
  return { currency: spec.currency, minor, label };
}

export function planPrice(country: string, planId: string, overrides?: PriceOverrides) {
  const plan = planById(planId);
  return money(country, baseMajor(country, overrides) * plan.multiplier);
}

export function boostPrice(country: string, overrides?: PriceOverrides) {
  const code = country.toUpperCase();
  const major = overrides?.boost?.[code] ?? PLAN_CONFIG.boost.majors[code] ?? PLAN_CONFIG.boost.majors.GH;
  return money(country, major);
}

export function hirerPrice(country: string, overrides?: PriceOverrides) {
  const code = country.toUpperCase();
  const major = overrides?.hirer?.[code] ?? PLAN_CONFIG.hirer.majors[code] ?? PLAN_CONFIG.hirer.majors.GH;
  return money(country, major);
}

/** Difference between plans for the days still left on a paid year. */
export function proratedUpgradeMinor(
  country: string,
  fromPlan: string,
  toPlan: string,
  daysLeft: number,
  overrides?: PriceOverrides,
): number {
  const from = planById(fromPlan).multiplier;
  const to = planById(toPlan).multiplier;
  if (to <= from || daysLeft <= 0) return 0;
  const base = baseMajor(country, overrides);
  const major = ((to - from) * base * daysLeft) / PLAN_CONFIG.yearDays;
  return money(country, major).minor;
}

export function daysLeft(expiresAt: string | Date | null): number {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

const COPY = {
  en: {
    7: "Your free trial ends in 7 days. Choose a plan to stay in search.",
    3: "Your free trial ends in 3 days.",
    1: "Your free trial ends tomorrow.",
  },
  fr: {
    7: "Votre essai gratuit se termine dans 7 jours. Choisissez une offre pour rester dans la recherche.",
    3: "Votre essai gratuit se termine dans 3 jours.",
    1: "Votre essai gratuit se termine demain.",
  },
} as const;

export function reminderCopy(language: string, day: number): string {
  const pack = language === "fr" ? COPY.fr : COPY.en;
  if (day <= 1) return pack[1];
  if (day <= 3) return pack[3];
  return pack[7];
}
