/** Paystack settles card and mobile money. The in-app Wallet is on. Flutterwave is not deployed. */

export const PROVIDER_SWITCH = {
  paystack: true,
  flutterwave: false,
  wallet: true,
} as const;

export const PROVIDER_LABELS: Record<string, string> = {
  paystack: "Mobile money or card (Paystack)",
  flutterwave: "Mobile money or card (Flutterwave)",
  wallet: "Wallet",
};

/** Active providers, in the order the person should see them. */
export const COUNTRY_PROVIDERS: Record<string, string[]> = {
  GH: ["paystack", "wallet"],
  NG: ["paystack", "wallet"],
  ZA: ["paystack", "wallet"],
  KE: ["paystack", "wallet"],
  CI: ["paystack", "wallet"],
  ZM: ["wallet"],
};

export function activeProviderIds(country: string): string[] {
  const listed = COUNTRY_PROVIDERS[country.toUpperCase()] ?? [];
  return listed.filter((id) => PROVIDER_SWITCH[id as keyof typeof PROVIDER_SWITCH]);
}
