import { getSql } from "@/lib/db";
import { hmacSha512Hex } from "@/lib/ids";
import type { PaymentProvider } from "@/lib/pay/types";

async function secret(): Promise<string | null> {
  const fromEnv = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const sql = await getSql();
    const rows = await sql.query<{ secret_key: string }>("select secret_key from paystack_keys where id = 'live' limit 1");
    const saved = rows[0]?.secret_key?.trim();
    return saved || null;
  } catch {
    return null;
  }
}

export const paystack: PaymentProvider = {
  id: "paystack",

  async createCheckout(order) {
    const key = await secret();
    if (!key) {
      return { ok: true, url: `${order.callbackUrl}?reference=${encodeURIComponent(order.reference)}&preview=1` };
    }
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: order.email,
        amount: order.amount,
        currency: order.currency,
        reference: order.reference,
        channels: [order.channel === "qr" || order.channel === "eft" ? "card" : order.channel],
        callback_url: order.callbackUrl,
        metadata: { user_id: order.userId, kind: order.kind, plan_id: order.planId },
      }),
    });
    const body = (await response.json()) as { status?: boolean; data?: { authorization_url?: string } };
    const url = body.data?.authorization_url;
    if (!response.ok || !body.status || !url) return { ok: false, error: "Paystack could not start the payment." };
    return { ok: true, url };
  },

  async verifyPayment(reference) {
    const key = await secret();
    if (!key) return { ok: false, error: "Paystack is not connected." };
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body = (await response.json()) as { data?: { status?: string; amount?: number; currency?: string } };
    if (!response.ok || body.data?.status !== "success") return { ok: false, error: "Paystack has not confirmed this payment yet." };
    return {
      ok: true,
      amount: Number(body.data.amount),
      currency: String(body.data.currency ?? "").toUpperCase(),
      status: "success",
    };
  },

  async handleWebhook(request) {
    const key = await secret();
    if (!key) return { ok: false, status: 400, error: "Paystack is not configured" };
    const raw = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const hash = await hmacSha512Hex(key, raw);
    if (hash !== signature) return { ok: false, status: 401, error: "Invalid signature" };
    const body = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
    if (body.event !== "charge.success" || !body.data?.reference) return { ok: true, reference: "" };
    return { ok: true, reference: body.data.reference };
  },

  async refund(reference) {
    const key = await secret();
    if (!key) return { ok: false, error: "Paystack is not connected." };
    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: reference }),
    });
    if (!response.ok) return { ok: false, error: "Paystack could not refund this payment." };
    return { ok: true };
  },
};

export async function paystackConfigured(): Promise<boolean> {
  return Boolean(await secret());
}

export async function paystackKeyStatus(): Promise<{ configured: boolean; publicKey: string }> {
  const sql = await getSql();
  const rows = await sql.query<{ public_key: string; secret_key: string }>(
    "select public_key, secret_key from paystack_keys where id = 'live' limit 1",
  );
  const env = Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
  return {
    configured: env || Boolean(rows[0]?.secret_key?.trim()),
    publicKey: rows[0]?.public_key ?? "",
  };
}

export async function savePaystackKeys(publicKey: string, secretKey: string): Promise<void> {
  const pub = publicKey.trim();
  const sec = secretKey.trim();
  if (pub && !pub.startsWith("pk_")) throw new Error("The public key should start with pk_.");
  if (sec && !sec.startsWith("sk_")) throw new Error("The secret key should start with sk_.");
  const sql = await getSql();
  await sql.query(
    `insert into paystack_keys (id, public_key, secret_key) values ('live', $1, $2)
     on conflict (id) do update set
       public_key = excluded.public_key,
       secret_key = case when excluded.secret_key = '' then paystack_keys.secret_key else excluded.secret_key end,
       updated_at = now()`,
    [pub, sec],
  );
}
