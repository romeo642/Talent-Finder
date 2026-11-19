import register from "@/lib/activation-register.json";

export type ActivationStatus = "Off" | "Built" | "Connected" | "Proven" | "Blocked";

export type ActivationRow = {
  id: string;
  feature: string;
  owner: string;
  status: ActivationStatus;
  flag: string;
  test: string;
  provenOn: string;
  notes: string;
};

export const ACTIVATION_AUDITED_ON = register.auditedOn;
export const ACTIVATION_ROWS = register.rows as ActivationRow[];
