export type PayChannel = "card" | "mobile_money" | "qr" | "bank" | "bank_transfer" | "ussd" | "eft";

export type PayMethod = {
  id: string;
  label: string;
  detail: string;
  channel: PayChannel;
};

/** Paystack checkout channels, limited to what Paystack offers in each country. */
const METHODS: Record<string, PayMethod[]> = {
  GH: [
    { id: "mtn", label: "MTN MoMo", detail: "Mobile money", channel: "mobile_money" },
    { id: "telecel", label: "Telecel Cash", detail: "Mobile money", channel: "mobile_money" },
    { id: "airteltigo", label: "AirtelTigo Money", detail: "Mobile money", channel: "mobile_money" },
    { id: "gh-card", label: "Card", detail: "Visa or Mastercard", channel: "card" },
  ],
  NG: [
    { id: "ng-transfer", label: "Bank transfer", detail: "Temporary Paystack account", channel: "bank_transfer" },
    { id: "ng-ussd", label: "USSD", detail: "Dial a bank code", channel: "ussd" },
    { id: "ng-qr", label: "QR code", detail: "Scan to pay", channel: "qr" },
    { id: "ng-opay", label: "OPay", detail: "Mobile wallet", channel: "bank" },
    { id: "ng-card", label: "Card", detail: "Visa, Mastercard, or Verve", channel: "card" },
  ],
  KE: [
    { id: "mpesa", label: "M-PESA", detail: "Safaricom mobile money", channel: "mobile_money" },
    { id: "airtel-ke", label: "Airtel Money", detail: "Mobile money", channel: "mobile_money" },
    { id: "ke-card", label: "Card", detail: "Visa or Mastercard", channel: "card" },
  ],
  ZA: [
    { id: "snapscan", label: "SnapScan", detail: "QR in the SnapScan app", channel: "qr" },
    { id: "scan-to-pay", label: "Scan to Pay", detail: "QR in your bank app", channel: "qr" },
    { id: "eft", label: "EFT", detail: "Bank transfer", channel: "eft" },
    { id: "za-card", label: "Card", detail: "Visa or Mastercard", channel: "card" },
  ],
  CI: [
    { id: "wave", label: "Wave", detail: "Mobile money", channel: "mobile_money" },
    { id: "orange", label: "Orange Money", detail: "Mobile money", channel: "mobile_money" },
    { id: "mtn-ci", label: "MTN MoMo", detail: "Mobile money", channel: "mobile_money" },
    { id: "ci-card", label: "Card", detail: "Visa or Mastercard", channel: "card" },
  ],
  ZM: [
    { id: "mtn-zm", label: "MTN MoMo", detail: "Mobile money", channel: "mobile_money" },
    { id: "airtel-zm", label: "Airtel Money", detail: "Mobile money", channel: "mobile_money" },
    { id: "zm-card", label: "Card", detail: "Visa or Mastercard", channel: "card" },
  ],
};

export function methodsFor(countryCode: string): PayMethod[] {
  return METHODS[countryCode] ?? METHODS.GH;
}

export function methodById(countryCode: string, id: string): PayMethod | null {
  return methodsFor(countryCode).find((method) => method.id === id) ?? null;
}
