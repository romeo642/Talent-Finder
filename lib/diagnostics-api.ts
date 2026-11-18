import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type DiagnosticCheck = { id: string; pass: boolean; advice: string };

export const APP_VERSION = "2026-11-06";

export const diagnosticsReport = createServerFn({ method: "GET" }).handler(async () => {
  const checks: DiagnosticCheck[] = [];
  try {
    const sql = await getSql();
    await sql.query("select 1 as ok");
    checks.push({ id: "database", pass: true, advice: "The database answered." });
  } catch {
    checks.push({ id: "database", pass: false, advice: "The database did not answer. Check the local database or DATABASE_URL." });
  }
  const paystack = Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
  checks.push({
    id: "payment",
    pass: paystack,
    advice: paystack
      ? "A Paystack secret is set. A sandbox payment is still not proven."
      : "No Paystack secret is set. Card and mobile money cannot be proven.",
  });
  checks.push({
    id: "webhook",
    pass: false,
    advice: "The Paystack webhook route exists. It is not proven until Paystack sends a signed test event.",
  });
  checks.push({ id: "email", pass: false, advice: "No email sender is connected. One-time codes and receipts cannot be sent." });
  checks.push({ id: "sms", pass: false, advice: "No SMS sender is connected." });
  checks.push({ id: "queue", pass: false, advice: "No queue worker is running. Reminders and retries have nowhere to go." });
  checks.push({ id: "chat", pass: false, advice: "No WebSocket chat server is running." });
  checks.push({ id: "translation", pass: false, advice: "No translation service is connected." });
  checks.push({
    id: "storage",
    pass: true,
    advice: "Photos and PDFs are stored in the database. There is no separate image bucket or CDN.",
  });
  checks.push({
    id: "maps",
    pass: true,
    advice: "Country, region and town lists are stored in the app. There is no live map.",
  });
  checks.push({
    id: "search",
    pass: true,
    advice: "Search is served by this app. It is not a separate search service.",
  });
  return { ok: true as const, data: { version: APP_VERSION, checks } };
});
