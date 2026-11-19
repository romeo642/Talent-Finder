import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import { creditWallet, moneyLabel } from "@/lib/pay/wallet";
import { PLAN_CONFIG, type PriceOverrides } from "@/lib/plans";
import { getPlanCatalog, savePlanOverrides } from "@/lib/plans-api";
import { assertAdmin, assertOwner, assertStaff } from "@/lib/staff";
import type { Role } from "@/lib/staff";
import { paystackKeyStatus, savePaystackKeys } from "@/lib/pay/paystack";

async function staffOrError(userId: string): Promise<string | null> {
  try {
    await assertStaff(userId);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Staff only.";
  }
}

async function adminOrError(userId: string): Promise<string | null> {
  try {
    await assertAdmin(userId);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Admin only.";
  }
}

async function logAdmin(subject: string): Promise<void> {
  const sql = await getSql();
  await sql.query("insert into admin_views (id, staff, subject) values ($1, 'admin', $2)", [randomId(), subject.slice(0, 160)]);
}

export const adminWallets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  const denied = await adminOrError(context.userId);
  if (denied) return { ok: false as const, error: denied };
  const sql = await getSql();
  await logAdmin("wallet list");
  const balances = await sql.query<{
    user_id: string;
    currency: string;
    available: number;
    name: string;
  }>(
    `select wallet_entries.user_id, wallet_entries.currency,
            coalesce(sum(case
              when wallet_entries.status = 'posted' then wallet_entries.amount
              when wallet_entries.status = 'pending' and wallet_entries.amount < 0 then wallet_entries.amount
              else 0 end), 0)::int as available,
            coalesce("user".name, wallet_entries.user_id) as name
     from wallet_entries
     left join "user" on "user".id = wallet_entries.user_id
     group by wallet_entries.user_id, wallet_entries.currency, "user".name
     order by available desc
     limit 40`,
  );
  const entries = await sql.query<{
    id: string;
    user_id: string;
    currency: string;
    amount: number;
    status: string;
    reference: string;
  }>(
    `select id, user_id, currency, amount, status, reference
     from wallet_entries
     order by created_at desc
     limit 20`,
  );
  return { ok: true as const, data: { balances, entries } };
});

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId?: string; country?: string; currency?: string; amount?: number; direction?: string; note?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOrError(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const userId = (data.userId ?? "").trim();
    const currency = (data.currency ?? "GHS").trim().toUpperCase();
    const country = (data.country ?? "GH").trim().toUpperCase();
    const major = Number(data.amount);
    if (!userId || !Number.isFinite(major) || major <= 0) return { ok: false as const, error: "Enter an account and an amount." };
    const spec = Object.values(PLAN_CONFIG.bases).find((item) => item.currency === currency);
    const minor = Math.round(major * (spec?.subunit ?? 100));
    const note = (data.note ?? "Staff adjustment").replace(/\s+/g, " ").trim().slice(0, 160);
    const reference = `ADJ-${randomId(4)}`.toUpperCase();
    if (data.direction === "remove") {
      const sql = await getSql();
      await sql.query(
        `insert into wallet_entries (id, user_id, country, currency, reference, amount, status)
         values ($1, $2, $3, $4, $5, $6, 'posted')`,
        [randomId(), userId, country, currency, reference, -minor],
      );
    } else {
      await creditWallet(userId, country, currency, reference, minor);
    }
    await logAdmin(`wallet ${data.direction === "remove" ? "remove" : "add"} ${reference} ${note}`);
    return { ok: true as const, data: { label: moneyLabel(currency, minor) } };
  });

export const adminAccounts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  const denied = await adminOrError(context.userId);
  if (denied) return { ok: false as const, error: denied };
  const sql = await getSql();
  await logAdmin("account list");
  const rows = await sql.query<{
    id: string;
    name: string;
    email: string;
    listing_id: string | null;
    display_name: string | null;
    country_code: string | null;
    verified: boolean;
    removed: boolean;
    role: string;
  }>(
    `select "user".id, "user".name, "user".email,
            listings.id as listing_id, listings.display_name, listings.country_code,
            coalesce(account_admin.verified, false) as verified,
            coalesce(account_admin.removed, false) as removed,
            coalesce(account_admin.role, 'user') as role
     from "user"
     left join listings on listings.user_id = "user".id and listings.is_sample = false
     left join account_admin on account_admin.user_id = "user".id
     order by "user"."createdAt" desc
     limit 40`,
  );
  return { ok: true as const, data: rows };
});

export const adminVerifyAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId?: string; verified?: boolean }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOrError(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const userId = (data.userId ?? "").trim();
    if (!userId) return { ok: false as const, error: "Choose an account." };
    const verified = data.verified === true;
    const sql = await getSql();
    await sql.query(
      `insert into account_admin (user_id, verified, updated_at) values ($1, $2, now())
       on conflict (user_id) do update set verified = excluded.verified, updated_at = now()`,
      [userId, verified],
    );
    await logAdmin(`verify ${userId} ${verified ? "on" : "off"}`);
    return { ok: true as const };
  });

export const adminRemoveAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOrError(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const userId = (data.userId ?? "").trim();
    if (!userId) return { ok: false as const, error: "Choose an account." };
    const sql = await getSql();
    await sql.query(
      `insert into account_admin (user_id, removed, note, updated_at) values ($1, true, 'Removed by staff', now())
       on conflict (user_id) do update set removed = true, note = 'Removed by staff', updated_at = now()`,
      [userId],
    );
    await sql.query(
      `update listings set visibility = 'hidden', hidden_reason = 'Removed by staff',
        phone = '', email = '', facebook = '', instagram = '', twitter = '', tiktok = '', reach = ''
       where user_id = $1 and is_sample = false`,
      [userId],
    );
    await sql.query(`delete from "session" where "userId" = $1`, [userId]);
    await sql.query(
      `update "user" set name = 'Removed account', email = $2 where id = $1`,
      [userId, `removed-${userId}@invalid.local`],
    );
    await logAdmin(`remove account ${userId}`);
    return { ok: true as const };
  });

export const adminPaystackStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const denied = await adminOrError(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const status = await paystackKeyStatus();
    return { ok: true as const, data: status };
  });

export const adminSavePaystack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { publicKey?: string; secretKey?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOrError(context.userId);
    if (denied) return { ok: false as const, error: denied };
    try {
      await savePaystackKeys(data.publicKey ?? "", data.secretKey ?? "");
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Could not save the keys." };
    }
    await logAdmin("paystack keys saved");
    return { ok: true as const };
  });

const ASSIGNABLE: Role[] = ["user", "reviewer", "admin", "owner"];

export const assignRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId?: string; role?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    try {
      await assertOwner(context.userId);
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Owner only." };
    }
    const userId = (data.userId ?? "").trim();
    const role = ASSIGNABLE.find((item) => item === data.role);
    if (!userId || !role) return { ok: false as const, error: "Choose an account and a role." };
    if (userId === context.userId) return { ok: false as const, error: "You cannot change your own role." };
    const sql = await getSql();
    await sql.query(
      `insert into account_admin (user_id, role, staff, updated_at) values ($1, $2, $3, now())
       on conflict (user_id) do update set role = excluded.role, staff = excluded.staff, updated_at = now()`,
      [userId, role, role !== "user"],
    );
    await logAdmin(`role ${userId} ${role}`);
    return { ok: true as const };
  });

export { getPlanCatalog, savePlanOverrides };
export type { PriceOverrides };
