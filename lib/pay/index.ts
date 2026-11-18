import { activeProviderIds, PROVIDER_LABELS } from "@/lib/pay/config";
import { flutterwave } from "@/lib/pay/flutterwave";
import { paystack } from "@/lib/pay/paystack";
import type { PaymentProvider } from "@/lib/pay/types";
import { wallet } from "@/lib/pay/wallet";

const ALL: Record<string, PaymentProvider> = {
  paystack,
  flutterwave,
  wallet,
};

export function providerById(id: string): PaymentProvider | null {
  return ALL[id] ?? null;
}

export function providersForCountry(country: string): { id: string; label: string }[] {
  return activeProviderIds(country).map((id) => ({ id, label: PROVIDER_LABELS[id] ?? id }));
}
