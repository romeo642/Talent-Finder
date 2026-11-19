import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import type { PaymentProvider } from "@/lib/pay/types";
import { PLAN_CONFIG } from "@/lib/plans";

function entryId(): string {
  return randomId();
}

export async function walletBalance(userId: string, currency: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql.query<{ available: number }>(
    `select coalesce(sum(case
        when status = 'posted' then amount
        when status = 'pending' and amount < 0 then amount
        else 0 end), 0)::int as available
     from wallet_entries
     where user_id = $1 and currency = $2`,
    [userId, currency],
  );
  return Number(rows[0]?.available ?? 0);
}

export async function creditWallet(userId: string, country: string, currency: string, reference: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const sql = await getSql();
  await sql.query(
    `insert into wallet_entries (id, user_id, country, currency, reference, amount, status)
     select $1, $2, $3, $4, $5, $6, 'posted'
     where not exists (select 1 from wallet_entries where reference = $5 and amount > 0)`,
    [entryId(), userId, country, currency, reference, amount],
  );
}

export async function postWalletHold(reference: string): Promise<void> {
  const sql = await getSql();
  await sql.query("update wallet_entries set status = 'posted' where reference = $1 and status = 'pending' and amount < 0", [reference]);
}

export async function voidWalletHold(reference: string): Promise<void> {
  const sql = await getSql();
  await sql.query("update wallet_entries set status = 'void' where reference = $1 and status = 'pending' and amount < 0", [reference]);
}

export const wallet: PaymentProvider = {
  id: "wallet",

  async createCheckout(order) {
    const sql = await getSql();
    const available = await walletBalance(order.userId, order.currency);
    if (available < order.amount) return { ok: false, error: "The Wallet balance is too low. Add money with mobile money or card first." };
    const inserted = await sql.query<{ id: string }>(
      `insert into wallet_entries (id, user_id, country, currency, reference, amount, status)
       select $1, $2, $3, $4, $5, $6, 'pending'
       where (
         select coalesce(sum(case
           when status = 'posted' then amount
           when status = 'pending' and amount < 0 then amount
           else 0 end), 0)
         from wallet_entries where user_id = $2 and currency = $4
       ) >= $7
       and not exists (select 1 from wallet_entries where reference = $5 and amount < 0)
       returning id`,
      [entryId(), order.userId, order.country, order.currency, order.reference, -order.amount, order.amount],
    );
    if (!inserted[0]) return { ok: false, error: "The Wallet balance is too low. Add money with mobile money or card first." };
    return { ok: true, url: `${order.callbackUrl}?reference=${encodeURIComponent(order.reference)}` };
  },

  async verifyPayment(reference) {
    const sql = await getSql();
    const rows = await sql.query<{ amount: number; currency: string }>(
      `select amount, currency from wallet_entries
       where reference = $1 and amount < 0 and status in ('pending', 'posted')
       limit 1`,
      [reference],
    );
    const row = rows[0];
    if (!row) return { ok: false, error: "Wallet has not confirmed this payment." };
    return { ok: true, amount: Math.abs(Number(row.amount)), currency: row.currency, status: "success" };
  },

  async handleWebhook() {
    return { ok: false, status: 404, error: "Wallet has no external webhook." };
  },

  async refund(reference) {
    const sql = await getSql();
    const rows = await sql.query<{ user_id: string; country: string; currency: string; amount: number }>(
      `select user_id, country, currency, amount from wallet_entries
       where reference = $1 and amount < 0 and status = 'posted' limit 1`,
      [reference],
    );
    const debit = rows[0];
    if (!debit) return { ok: false, error: "There is no Wallet payment to refund." };
    await creditWallet(debit.user_id, debit.country, debit.currency, `${reference}-REFUND`, Math.abs(Number(debit.amount)));
    return { ok: true };
  },
};

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{ currency: string; available: number }>(
      `select currency,
              coalesce(sum(case
                when status = 'posted' then amount
                when status = 'pending' and amount < 0 then amount
                else 0 end), 0)::int as available
       from wallet_entries where user_id = $1
       group by currency`,
      [context.userId],
    );
    return { ok: true as const, data: rows };
  });

export function moneyLabel(currency: string, minor: number): string {
  const spec = Object.values(PLAN_CONFIG.bases).find((item) => item.currency === currency);
  const subunit = spec?.subunit ?? 100;
  const major = minor / subunit;
  const shown = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${currency} ${shown}`;
}
