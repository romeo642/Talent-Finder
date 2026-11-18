export type PaymentOrder = {
  reference: string;
  userId: string;
  country: string;
  kind: string;
  planId: string | null;
  amount: number;
  currency: string;
  email: string;
  description: string;
  callbackUrl: string;
  channel: string;
};

export type VerifiedPayment = {
  ok: true;
  amount: number;
  currency: string;
  status: "success";
};

export type PaymentProvider = {
  id: string;
  createCheckout(order: PaymentOrder): Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  verifyPayment(reference: string): Promise<VerifiedPayment | { ok: false; error: string }>;
  handleWebhook(request: Request): Promise<{ ok: true; reference: string } | { ok: false; status: number; error: string }>;
  refund(reference: string): Promise<{ ok: true } | { ok: false; error: string }>;
};
