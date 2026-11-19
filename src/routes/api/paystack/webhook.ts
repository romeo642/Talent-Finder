import { createFileRoute } from "@tanstack/react-router";
import { fulfillPaidListing } from "@/lib/listings-api";
import { settleReference } from "@/lib/pay/orders";
import { paystack } from "@/lib/pay/paystack";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await paystack.handleWebhook(request);
        if (!parsed.ok) return new Response(parsed.error, { status: parsed.status });
        if (parsed.reference) {
          const settled = await settleReference(parsed.reference);
          if (!settled.ok) await fulfillPaidListing(parsed.reference);
        }
        return new Response("ok");
      },
    },
  },
});
