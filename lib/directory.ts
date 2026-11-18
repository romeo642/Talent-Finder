export const DUE_DILIGENCE =
  "Talent Finder is a directory only. We do not employ, recommend, vet, or guarantee any person listed. Before you contact, meet, hire, or pay anyone, do your own due diligence. Meet in a public place, confirm who they are, and never send money in advance to someone you have not met.";

export type PublicListing = {
  id: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  townCode: string;
  townName: string;
  communityCode: string;
  communityName: string;
  skillId: string;
  skillName: string;
  years: number;
  displayName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  reach: string | null;
  contactActive: boolean;
  experience: string;
  photo: string;
  sample: boolean;
  feeLabel: string;
  views: number;
  planId: string;
  planStatus: string;
  daysLeft: number;
  badge: string | null;
  listed: boolean;
  language: string;
  photos: string[];
  hiddenPhotoCount: number;
  workChecked: boolean;
  reviewStatus: string;
  hiddenReason: string;
  staffVerified: boolean;
  documentName: string;
  restricted: boolean;
};

export type OwnerListing = PublicListing;

export function opensLabel(views: number): string {
  if (views <= 0) return "Not opened yet";
  if (views === 1) return "Opened once";
  return `Opened ${views} times`;
}

export function yearsLabel(years: number): string {
  if (years <= 0) return "Under 1 year";
  if (years === 1) return "1 year";
  return `${years} years`;
}

export function placeLine(listing: Pick<PublicListing, "communityName" | "townName" | "regionName" | "countryName">): string {
  return `${listing.communityName}, ${listing.townName}, ${listing.regionName}, ${listing.countryName}`;
}

export function idMoved(listing: PublicListing): boolean {
  const prefix = `${listing.countryCode}-${listing.regionCode}-${listing.townCode}-${listing.communityCode}`;
  return !listing.id.startsWith(`${prefix}-`);
}

export function normalizePhone(raw: string, dial: string): string | null {
  let digits = raw.replace(/\D/g, "");
  const cc = dial.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = cc + digits.slice(1);
  if (!digits.startsWith(cc)) digits = cc + digits;
  if (digits.length < cc.length + 8 || digits.length > cc.length + 12) return null;
  return `+${digits}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.startsWith("234") && digits.length >= 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith("254") && digits.length >= 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith("27") && digits.length >= 11) {
    return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.startsWith("225") && digits.length >= 12) {
    return `+225 ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}][\p{L}\s'.-]{1,47}$/u;

export function cleanName(value: string): string | null {
  const name = value.replace(/\s+/g, " ").trim();
  if (!NAME_RE.test(name)) return null;
  return name;
}

export function cleanReach(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length > 180) throw new Error("Keep the meeting note under 180 characters.");
  return text;
}

export function cleanEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (email.length > 80 || !EMAIL_RE.test(email)) return null;
  return email;
}

const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;

/** Keep a public @name. Full links are accepted only for that network, then reduced to the name. */
export function cleanSocial(value: string, hosts: string[], label: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length > 160) throw new Error(`That ${label} name is too long.`);
  let handle = raw.replace(/^@/, "");
  if (raw.includes("/") || /^https?:\/\//i.test(raw)) {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let url: URL;
    try {
      url = new URL(withScheme);
    } catch {
      throw new Error(`That ${label} link is not valid.`);
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error(`That ${label} link is not valid.`);
    }
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!hosts.includes(host)) throw new Error(`Use a ${label} name like @yourname, or a ${label} link.`);
    handle = (url.pathname.split("/").filter(Boolean)[0] ?? "").replace(/^@/, "");
  }
  if (!HANDLE_RE.test(handle)) throw new Error(`Use a ${label} name like @yourname.`);
  return handle;
}
