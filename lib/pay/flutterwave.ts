import type { PaymentProvider } from "@/lib/pay/types";

const NOT_DEPLOYED = "Flutterwave is not deployed yet.";

/** Same four calls as Paystack. Switched off until Flutterwave is deployed. */
export const flutterwave: PaymentProvider = {
  id: "flutterwave",
  async createCheckout() {
    return { ok: false, error: NOT_DEPLOYED };
  },
  async verifyPayment() {
    return { ok: false, error: NOT_DEPLOYED };
  },
  async handleWebhook() {
    return { ok: false, status: 404, error: NOT_DEPLOYED };
  },
  async refund() {
    return { ok: false, error: NOT_DEPLOYED };
  },
};
