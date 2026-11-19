import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import { providerById, providersForCountry } from "@/lib/pay/index";
import { paystackConfigured } from "@/lib/pay/paystack";
import { PLAN_CONFIG, planById } from "@/lib/plans";
import { assertAdmin } from "@/lib/staff";

export type OrderRow = {
  reference: string;
  user_id: string;
  kind: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  status: string;
  expires_at: string | null;
  country: string;
  provider: string;
  display_name: string;
  language: string;
  created_at: string;
  confirmed_at: string | null;
};

function eventId(): string {
  return randomId();
}

export function newReference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${randomId(3)}`.toUpperCase();
}

async function logEvent(reference: string, event: string): Promise<void> {
  const sql = await getSql();
  await sql.query("insert into payment_events (id, reference, event) values ($1, $2, $3)", [eventId(), reference, event]);
}

export async function expireStaleOrders(): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `update payments set status = 'expired'
     where status = 'pending' and created_at < now() - interval '30 minutes'`,
  );
}

function majorLabel(currency: string, amount: number): string {
  const spec = Object.values(PLAN_CONFIG.bases).find((item) => item.currency === currency);
  const subunit = spec?.subunit ?? 100;
  const major = amount / subunit;
  const shown = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${currency} ${shown}`;
}

export function receiptCopy(order: OrderRow): string {
  const plan = order.plan_id ? planById(order.plan_id).name : order.kind;
  const when = order.confirmed_at ? new Date(order.confirmed_at).toISOString().slice(0, 10) : "";
  const until = order.expires_at ? new Date(order.expires_at).toISOString().slice(0, 10) : "";
  const amount = majorLabel(order.currency, Number(order.amount));
  if (order.language === "fr") {
    return `Reçu\nNom : ${order.display_name}\nOffre : ${plan}\nMontant : ${amount}\nRéférence : ${order.reference}\nDate : ${when}\nValable jusqu'au : ${until}`;
  }
  return `Receipt\nName: ${order.display_name}\nPlan: ${plan}\nAmount: ${amount}\nReference: ${order.reference}\nDate: ${when}\nValid until: ${until}`;
}

async function applyPaid(order: OrderRow): Promise<void> {
  const sql = await getSql();
  if ((order.kind === "plan" || order.kind === "upgrade") && order.plan_id && order.expires_at) {
    await sql.query(
      `update listings set plan_id = $2, plan_status = 'active', plan_expires_at = $3, boosts_used = 0, boosts_year = $4
       where user_id = $1 and is_sample = false`,
      [order.user_id, order.plan_id, order.expires_at, new Date().getFullYear()],
    );
  }
  if (order.kind === "boost") {
    await sql.query(
      `update listings set boost_until = case
         when boost_until is not null and boost_until > now() then boost_until + interval '7 days'
         else now() + interval '7 days' end
       where user_id = $1 and is_sample = false`,
      [order.user_id],
    );
  }
  if (order.kind === "hirer" && order.expires_at) {
    await sql.query(
      `insert into hirer_plans (user_id, expires_at, reference) values ($1, $2, $3)
       on conflict (user_id) do update set expires_at = excluded.expires_at, reference = excluded.reference`,
      [order.user_id, order.expires_at, order.reference],
    );
  }
}

export async function settleReference(reference: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = await getSql();
  const rows = await sql.query<OrderRow>("select * from payments where reference = $1 limit 1", [reference]);
  const order = rows[0];
  if (!order) return { ok: false, error: "This payment was not found." };
  if (order.status === "paid" || order.status === "success" || order.status === "refunded") return { ok: true };
  if (order.status === "expired") return { ok: false, error: "This payment expired. Start again." };
  const provider = providerById(order.provider);
  if (!provider) return { ok: false, error: "This provider is not available." };
  let verified: { ok: true; amount: number; currency: string } | { ok: false; error: string };
  if (!(await paystackConfigured()) && order.provider === "paystack") {
    verified = { ok: true, amount: Number(order.amount), currency: order.currency };
  } else {
    verified = await provider.verifyPayment(reference);
  }
  if (!verified.ok) {
    await logEvent(reference, "verify_failed");
    return verified;
  }
  if (Number(verified.amount) !== Number(order.amount) || verified.currency !== order.currency) {
    await sql.query("update payments set status = 'failed' where reference = $1 and status = 'pending'", [reference]);
    await logEvent(reference, "amount_mismatch");
    return { ok: false, error: "The amount paid does not match the order." };
  }
  const won = await sql.query<OrderRow>(
    `update payments set status = 'paid', confirmed_at = now()
     where reference = $1 and status = 'pending'
     returning reference, user_id, kind, plan_id, amount, currency, status, expires_at, country, provider, display_name, language, created_at::text as created_at, confirmed_at::text as confirmed_at`,
    [reference],
  );
  const applied = won[0];
  if (!applied) return { ok: true };
  await applyPaid(applied);
  await logEvent(reference, "paid");
  await logEvent(reference, "receipt");
  return { ok: true };
}

export async function placeOrder(input: {
  userId: string;
  country: string;
  providerId?: string;
  kind: string;
  planId: string | null;
  amount: number;
  currency: string;
  label: string;
  expiresAt: string;
  email: string;
  displayName: string;
  language: string;
  channel: string;
  origin: string;
  prefix: string;
}): Promise<
  | { ok: true; data: { status: "choose"; providers: { id: string; label: string }[] } }
  | { ok: true; data: { status: "pay"; authorizationUrl: string; reference: string; feeLabel: string } }
  | { ok: false; error: string }
> {
  await expireStaleOrders();
  const choices = providersForCountry(input.country);
  if (choices.length === 0) {
    return { ok: false, error: "Paid plans are not available in this country yet. The free trial still works." };
  }
  if (!input.providerId && choices.length > 1) {
    return { ok: true, data: { status: "choose", providers: choices } };
  }
  const providerId = input.providerId || choices[0].id;
  const provider = providerById(providerId);
  if (!provider || !choices.some((item) => item.id === providerId)) {
    return { ok: false, error: "Choose a payment provider." };
  }
  const reference = newReference(input.prefix);
  const sql = await getSql();
  await sql.query(
    `insert into payments (reference, user_id, kind, plan_id, amount, currency, expires_at, country, provider, display_name, language)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      reference,
      input.userId,
      input.kind,
      input.planId,
      input.amount,
      input.currency,
      input.expiresAt,
      input.country,
      providerId,
      input.displayName,
      input.language === "fr" ? "fr" : "en",
    ],
  );
  await logEvent(reference, "created");
  const checkout = await provider.createCheckout({
    reference,
    userId: input.userId,
    country: input.country,
    kind: input.kind,
    planId: input.planId,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    description: input.label,
    callbackUrl: `${input.origin.replace(/\/$/, "")}/pay/callback`,
    channel: input.channel,
  });
  if (!checkout.ok) {
    await sql.query("update payments set status = 'failed' where reference = $1", [reference]);
    await logEvent(reference, "checkout_failed");
    return checkout;
  }
  if (!(await paystackConfigured()) && providerId === "paystack") await settleReference(reference);
  return { ok: true, data: { status: "pay", authorizationUrl: checkout.url, reference, feeLabel: input.label } };
}

export const readPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reference?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const reference = (data.reference ?? "").trim();
    if (!reference) return { ok: false as const, error: "Missing payment reference." };
    const sql = await getSql();
    const rows = await sql.query<OrderRow>(
      `select reference, user_id, kind, plan_id, amount, currency, status, expires_at,
              country, provider, display_name, language, created_at::text as created_at, confirmed_at::text as confirmed_at
       from payments where reference = $1 and user_id = $2 limit 1`,
      [reference, context.userId],
    );
    const order = rows[0];
    if (!order) return { ok: true as const, data: { state: "unknown" as const } };
    if (order.status === "paid" || order.status === "success") {
      return { ok: true as const, data: { state: "paid" as const, receipt: receiptCopy(order) } };
    }
    if (order.status === "failed" || order.status === "expired" || order.status === "refunded") {
      return { ok: true as const, data: { state: order.status as "failed" | "expired" | "refunded" } };
    }
    return { ok: true as const, data: { state: "pending" as const } };
  });

export const adminOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { country?: string; provider?: string; status?: string; reference?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await getSql();
    const where = ["true"];
    const params: unknown[] = [];
    const add = (column: string, value: string | undefined) => {
      const clean = (value ?? "").trim();
      if (!clean) return;
      params.push(clean);
      where.push(`${column} = $${params.length}`);
    };
    add("country", data.country?.toUpperCase());
    add("provider", data.provider);
    add("status", data.status);
    if (data.reference?.trim()) {
      params.push(data.reference.trim());
      where.push(`reference = $${params.length}`);
    }
    const orders = await sql.query<{
      reference: string;
      country: string;
      provider: string;
      status: string;
      amount: number;
      currency: string;
      kind: string;
    }>(
      `select reference, country, provider, status, amount, currency, kind
       from payments where ${where.join(" and ")}
       order by created_at desc limit 40`,
      params,
    );
    const report = await sql.query<{ country: string; paid: number; revenue: number; failed: number }>(
      `select country,
              count(*) filter (where status in ('paid', 'success'))::int as paid,
              coalesce(sum(amount) filter (where status in ('paid', 'success')), 0)::int as revenue,
              count(*) filter (where status = 'failed')::int as failed
       from payments
       where created_at >= date_trunc('day', now())
       group by country
       order by country`,
    );
    return { ok: true as const, data: { orders, report } };
  });

export const refundOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reference?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const reference = (data.reference ?? "").trim();
    const sql = await getSql();
    const rows = await sql.query<OrderRow>("select * from payments where reference = $1 limit 1", [reference]);
    const order = rows[0];
    if (!order) return { ok: false as const, error: "Order not found." };
    if (order.status !== "paid" && order.status !== "success") return { ok: false as const, error: "Only a paid order can be refunded." };
    const provider = providerById(order.provider);
    if (!provider) return { ok: false as const, error: "This provider is not available." };
    const result = await provider.refund(reference);
    if (!result.ok) return result;
    await sql.query("update payments set status = 'refunded' where reference = $1", [reference]);
    await logEvent(reference, "refunded");
    return { ok: true as const };
  });
