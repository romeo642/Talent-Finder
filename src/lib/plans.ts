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
  /** Yearly price in major units. Every plan is this amount, about GHS 20. */
  bases: {
    GH: { currency: "GHS", major: 20, subunit: 100 },
    CI: { currency: "XOF", major: 902, subunit: 1 },
    NG: { currency: "NGN", major: 2040, subunit: 100 },
    ZA: { currency: "ZAR", major: 25, subunit: 100 },
    ZM: { currency: "ZMW", major: 35, subunit: 100 },
    KE: { currency: "KES", major: 195, subunit: 100 },
  } as Record<string, { currency: string; major: number; subunit: number }>,
  boost: {
    days: 7,
    majors: { GH: 20, CI: 902, NG: 2040, ZA: 25, ZM: 35, KE: 195 } as Record<string, number>,
  },
  hirer: {
    majors: { GH: 20, CI: 902, NG: 2040, ZA: 25, ZM: 35, KE: 195 } as Record<string, number>,
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
  planById(planId);
  return money(country, baseMajor(country, overrides));
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
  void country;
  void overrides;
  if (to <= from || daysLeft <= 0) return 0;
  return 0;
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
