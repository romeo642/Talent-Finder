const BANNED = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shit",
  "shitty",
  "bitch",
  "bastard",
  "asshole",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "porn",
  "porno",
  "nude",
  "nudes",
  "xxx",
  "rape",
  "rapist",
  "nigga",
  "nigger",
  "faggot",
  "fag",
  "retard",
  "blowjob",
  "handjob",
  "escort",
  "hookup",
  "ashawo",
  "prostitut",
];

const STEMS = ["prostitut", "pornograph", "childporn"];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function joinSpacedLetters(value: string): string {
  return value.replace(/\b(?:[a-z]\s+){2,}[a-z]\b/g, (match) => match.replace(/\s+/g, ""));
}

/** Returns true when public text should be rejected. Does not echo the match. */
export function hasProfanity(input: string): boolean {
  const base = joinSpacedLetters(normalize(input));
  const collapsed = base.replace(/(.)\1{2,}/g, "$1");
  const haystacks = [base, collapsed];
  for (const hay of haystacks) {
    if (STEMS.some((stem) => hay.includes(stem))) return true;
    for (const word of BANNED) {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (re.test(hay)) return true;
    }
  }
  return false;
}
