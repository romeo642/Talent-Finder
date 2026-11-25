// Paystack dashboard -> Settings -> API Keys & Webhooks
// Webhook URL: https://YOUR-SITE.netlify.app/.netlify/functions/paystack-webhook
const crypto = require("crypto");
const { activate } = require("./lib/activate");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body || "";

  // 1. Confirm the request really came from Paystack
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(raw)
    .digest("hex");
  const sent = event.headers["x-paystack-signature"];
  if (!sent || sent !== expected) return { statusCode: 401, body: "Bad signature" };

  // 2. Handle successful charges only
  const payload = JSON.parse(raw);
  if (payload.event === "charge.success") {
    const d = payload.data;
    const out = await activate({
      userId: d.metadata && d.metadata.user_id,
      reference: d.reference,
      amount: d.amount,
      currency: d.currency,
    });
    if (!out.ok) console.error("Webhook activate failed:", out.error);
  }

  // 3. Always answer 200 so Paystack stops retrying
  return { statusCode: 200, body: "ok" };
};
