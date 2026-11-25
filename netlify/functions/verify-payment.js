// POST /.netlify/functions/verify-payment
// Headers: Authorization: Bearer <user's Supabase access token>
// Body: { "reference": "..." }
const { activate } = require("./lib/activate");

const reply = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "Use POST" });

  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let reference;
  try {
    reference = JSON.parse(event.body || "{}").reference;
  } catch {
    return reply(400, { error: "Bad JSON" });
  }
  if (!token || !reference) return reply(400, { error: "Missing token or reference" });

  // 1. Who is paying? Ask Supabase to validate the user's token.
  const u = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!u.ok) return reply(401, { error: "Please sign in again" });
  const user = await u.json();

  // 2. Ask Paystack if this payment really succeeded.
  const p = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  const result = await p.json();
  if (!p.ok || !result.status || result.data.status !== "success") {
    return reply(402, { error: "Payment not successful", detail: result.message });
  }

  // 3. Record it and activate the subscription.
  const out = await activate({
    userId: user.id,
    reference: result.data.reference,
    amount: result.data.amount,
    currency: result.data.currency,
  });
  return out.ok ? reply(200, out) : reply(400, out);
};
