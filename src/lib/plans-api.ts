import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/staff";
import { getSql } from "@/lib/db";
import { cleanEmail } from "@/lib/directory";
import { methodById } from "@/lib/payments";
import { placeOrder, settleReference } from "@/lib/pay/orders";
import { providersForCountry } from "@/lib/pay/index";
import {
  PLAN_CONFIG,
  boostPrice,
  daysLeft,
  hirerPrice,
  planById,
  planPrice,
  photosForPlan,
  reminderCopy,
  type PriceOverrides,
} from "@/lib/plans";

type PayRow = {
  reference: string;
  user_id: string;
  kind: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  status: string;
  expires_at: string | null;
};

export async function loadOverrides(): Promise<PriceOverrides> {
  const sql = await getSql();
  const rows = await sql.query<{ value: string }>("select value from plan_settings where key = 'overrides' limit 1");
  if (!rows[0]) return {};
  try {
    return JSON.parse(rows[0].value) as PriceOverrides;
  } catch {
    return {};
  }
}

export const getPlanCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const overrides = await loadOverrides();
  return { ok: true as const, data: { config: PLAN_CONFIG, overrides } };
});

export const savePlanOverrides = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { overrides?: PriceOverrides; key?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const expected = process.env.PLAN_ADMIN_KEY?.trim();
    if (expected && data.key !== expected) return { ok: false as const, error: "The admin key does not match." };
    const overrides = data.overrides ?? {};
    const sql = await getSql();
    await sql.query(
      `insert into plan_settings (key, value) values ('overrides', $1)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(overrides)],
    );
    return { ok: true as const };
  });

async function accountEmail(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql.query<{ email: string }>(`select email from "user" where id = $1 limit 1`, [userId]);
  const email = cleanEmail(rows[0]?.email ?? "");
  if (!email || email.endsWith("@viewer.grok.invalid")) return null;
  return email;
}

async function owned(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    country_code: string;
    plan_id: string;
    plan_status: string;
    plan_expires_at: string | null;
    boosts_used: number;
    boosts_year: number;
    language: string;
    display_name: string;
  }>(
    `select id, country_code, plan_id, plan_status, plan_expires_at, boosts_used, boosts_year, language, display_name
     from listings where user_id = $1 and is_sample = false limit 1`,
    [userId],
  );
  return { sql, listing: rows[0] ?? null };
}

export async function confirmPaidReference(reference: string): Promise<{ ok: true; expiresAt: string; label: string } | { ok: false; error: string }> {
  const settled = await settleReference(reference);
  if (!settled.ok) return settled;
  const sql = await getSql();
  const rows = await sql.query<PayRow>("select * from payments where reference = $1 limit 1", [reference]);
  const payment = rows[0];
  if (!payment) return { ok: false, error: "This payment was not found." };
  return { ok: true, expiresAt: payment.expires_at ?? new Date().toISOString(), label: payment.kind };
}

async function startCheckout(input: {
  userId: string;
  country: string;
  kind: "plan" | "boost" | "hirer" | "upgrade";
  planId: string | null;
  minor: number;
  currency: string;
  label: string;
  expiresAt: string;
  payMethod: string;
  origin: string;
  providerId?: string;
  displayName: string;
  language: string;
}) {
  const method = methodById(input.country, input.payMethod);
  if (!method) return { ok: false as const, error: "Choose mobile money or card." };
  const email = (await accountEmail(input.userId)) ?? "";
  if (!email && providersForCountry(input.country).length > 0) {
    return { ok: false as const, error: "Paystack needs an email on the account." };
  }
  const placed = await placeOrder({
    userId: input.userId,
    country: input.country,
    providerId: input.providerId,
    kind: input.kind,
    planId: input.planId,
    amount: input.minor,
    currency: input.currency,
    label: input.label,
    expiresAt: input.expiresAt,
    email,
    displayName: input.displayName,
    language: input.language,
    channel: method.channel,
    origin: input.origin,
    prefix: input.kind === "plan" || input.kind === "upgrade" ? "PLAN" : input.kind === "boost" ? "BOOST" : "HIRER",
  });
  if (!placed.ok) return placed;
  if (placed.data.status === "choose") return { ok: true as const, data: placed.data };
  return {
    ok: true as const,
    data: {
      status: "paystack" as const,
      authorizationUrl: placed.data.authorizationUrl,
      reference: placed.data.reference,
      feeLabel: placed.data.feeLabel,
    },
  };
}

export const purchasePlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { planId?: string; payMethod?: string; origin?: string; providerId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { sql, listing } = await owned(context.userId);
    if (!listing) return { ok: false as const, error: "Publish your profile before you choose a plan." };
    if (providersForCountry(listing.country_code).length === 0) {
      return { ok: false as const, error: "Paid plans are not available in this country yet. The free trial still works." };
    }
    const plan = planById(data.planId ?? "");
    const overrides = await loadOverrides();
    const left = listing.plan_status === "active" ? daysLeft(listing.plan_expires_at) : 0;
    const price = planPrice(listing.country_code, plan.id, overrides);
    if (left > 0 && plan.id !== listing.plan_id) {
      await sql.query("update listings set plan_id = $2 where user_id = $1 and is_sample = false", [context.userId, plan.id]);
      return { ok: true as const, data: { status: "switched" as const, feeLabel: price.label, authorizationUrl: "", reference: "", providers: [] as { id: string; label: string }[] } };
    }
    const minor = price.minor;
    if (minor <= 0) return { ok: false as const, error: "Choose a plan to pay, or use Renew after the current one ends." };
    const expiresAt = new Date(Date.now() + PLAN_CONFIG.yearDays * 86_400_000).toISOString();
    return startCheckout({
      userId: context.userId,
      country: listing.country_code,
      kind: "plan",
      planId: plan.id,
      minor,
      currency: price.currency,
      label: price.label,
      expiresAt,
      payMethod: data.payMethod ?? "",
      origin: data.origin ?? "",
      providerId: data.providerId,
      displayName: listing.display_name,
      language: listing.language,
    });
  });

export const purchaseBoost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { payMethod?: string; origin?: string; providerId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { listing } = await owned(context.userId);
    if (!listing) return { ok: false as const, error: "Publish your profile first." };
    const overrides = await loadOverrides();
    const price = boostPrice(listing.country_code, overrides);
    const expiresAt = new Date(Date.now() + PLAN_CONFIG.boost.days * 86_400_000).toISOString();
    return startCheckout({
      userId: context.userId,
      country: listing.country_code,
      kind: "boost",
      planId: null,
      minor: price.minor,
      currency: price.currency,
      label: price.label,
      expiresAt,
      payMethod: data.payMethod ?? "",
      origin: data.origin ?? "",
      providerId: data.providerId,
      displayName: listing.display_name,
      language: listing.language,
    });
  });

export const purchaseHirer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { country?: string; payMethod?: string; origin?: string; providerId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const country = (data.country ?? "GH").toUpperCase();
    const overrides = await loadOverrides();
    const price = hirerPrice(country, overrides);
    const expiresAt = new Date(Date.now() + PLAN_CONFIG.yearDays * 86_400_000).toISOString();
    return startCheckout({
      userId: context.userId,
      country,
      kind: "hirer",
      planId: null,
      minor: price.minor,
      currency: price.currency,
      label: price.label,
      expiresAt,
      payMethod: data.payMethod ?? "",
      origin: data.origin ?? "",
      providerId: data.providerId,
      displayName: "Hirer",
      language: "en",
    });
  });

export const confirmPlanPreview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reference?: string }) => input ?? {})
  .handler(async ({ data }) => {
    return confirmPaidReference((data.reference ?? "").trim().toUpperCase());
  });

export const useFreeBoost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql, listing } = await owned(context.userId);
    if (!listing) return { ok: false as const, error: "Publish your profile first." };
    if (listing.plan_status !== "active" || daysLeft(listing.plan_expires_at) <= 0) {
      return { ok: false as const, error: "A free Boost is part of a paid Plus or Elite year." };
    }
    const allowance = planById(listing.plan_id).boostsPerYear;
    const year = new Date().getFullYear();
    const used = listing.boosts_year === year ? Number(listing.boosts_used) : 0;
    if (used >= allowance) return { ok: false as const, error: "The free Boosts for this year are used." };
    await sql.query(
      `update listings set boost_until = now() + interval '7 days', boosts_used = $2, boosts_year = $3
       where user_id = $1 and is_sample = false`,
      [context.userId, used + 1, year],
    );
    return { ok: true as const, data: { left: allowance - used - 1 } };
  });

export const downgradePlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { planId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { sql, listing } = await owned(context.userId);
    if (!listing) return { ok: false as const, error: "Publish your profile first." };
    const next = planById(data.planId ?? "starter");
    if (next.multiplier >= planById(listing.plan_id).multiplier) {
      return { ok: false as const, error: "Choose a lower plan. Upgrades are paid." };
    }
    await sql.query("update listings set plan_id = $2 where user_id = $1 and is_sample = false", [context.userId, next.id]);
    const photos = await sql.query<{ n: number }>("select count(*)::int as n from listing_gallery where listing_id = $1", [listing.id]);
    const visible = photosForPlan(next.id);
    const hidden = Math.max(0, Number(photos[0]?.n ?? 0) - visible);
    return { ok: true as const, data: { hidden, visible } };
  });

export const pullReminders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql, listing } = await owned(context.userId);
    if (!listing || listing.plan_status !== "trial") return { ok: true as const, data: [] as string[] };
    const left = daysLeft(listing.plan_expires_at);
    const notes: string[] = [];
    for (const day of PLAN_CONFIG.reminderDays) {
      if (left <= 0 || left > day) continue;
      const inserted = await sql.query<{ day: number }>(
        `insert into plan_reminders (listing_id, day) values ($1, $2)
         on conflict do nothing returning day`,
        [listing.id, day],
      );
      if (inserted[0]) notes.push(reminderCopy(listing.language, day));
    }
    return { ok: true as const, data: notes };
  });
