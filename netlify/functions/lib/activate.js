// Shared by verify-payment.js and paystack-webhook.js
// Records a payment once, then extends the user's subscription by 365 days.

// Expected price per currency, in the smallest unit (pesewas).
// Add ZMW: 3500 only if Paystack supports Zambia on your account.
const PRICES = { GHS: 2000 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sbHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function activate({ userId, reference, amount, currency }) {
  const url = process.env.SUPABASE_URL;

  if (!UUID.test(userId || "")) return { ok: false, error: "Bad user id" };
  if (PRICES[currency] !== amount) {
    return { ok: false, error: "Amount or currency does not match the price" };
  }

  // 1. Record the payment. The unique reference blocks double use (409).
  const ins = await fetch(`${url}/rest/v1/payments`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      user_id: userId,
      reference,
      amount,
      currency,
      status: "paid",
      paid_at: new Date().toISOString(),
    }),
  });
  if (ins.status === 409) return { ok: true, already: true };
  if (!ins.ok) return { ok: false, error: await ins.text() };

  // 2. Work out the new expiry (extend from current expiry if still active)
  const cur = await fetch(
    `${url}/rest/v1/subscriptions?user_id=eq.${userId}&select=expires_at`,
    { headers: sbHeaders() }
  );
  const rows = cur.ok ? await cur.json() : [];
  let start = new Date();
  if (rows[0] && new Date(rows[0].expires_at) > start) {
    start = new Date(rows[0].expires_at);
  }
  start.setDate(start.getDate() + 365);

  // 3. Save it (insert, or update if the user already has a row)
  const up = await fetch(`${url}/rest/v1/subscriptions`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({
      user_id: userId,
      expires_at: start.toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!up.ok) return { ok: false, error: await up.text() };

  return { ok: true, expires_at: start.toISOString() };
}

module.exports = { activate };
