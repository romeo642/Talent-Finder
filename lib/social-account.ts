import { cleanSocial } from "./directory.ts";

export type SocialSignup = "facebook" | "instagram" | "tiktok";

const HOSTS: Record<SocialSignup, string[]> = {
  facebook: ["facebook.com", "fb.com", "m.facebook.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
};

const LABELS: Record<SocialSignup, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

/** The account email is derived from the public name so the person can sign in with that name later. */
export function socialSignupEmail(network: SocialSignup, raw: string): { handle: string; email: string } {
  const handle = cleanSocial(raw, HOSTS[network], LABELS[network]).toLowerCase();
  if (!handle) throw new Error(`Enter your ${LABELS[network]} name.`);
  return { handle, email: `${network}.${handle}@signup.talentfinder.invalid` };
}
