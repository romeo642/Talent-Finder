/** A short code the person puts on a social profile. Talent Finder does not log into that network. */
export function socialCode(listingId: string, network: string): string {
  let hash = 2166136261;
  const text = `${listingId}:${network}`;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TF-";
  let value = hash >>> 0;
  for (let i = 0; i < 4; i += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }
  return code;
}
