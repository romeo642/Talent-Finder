import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  cleanEmail,
  cleanName,
  cleanReach,
  cleanSocial,
  normalizePhone,
  type PublicListing,
} from "@/lib/directory";
import { hasProfanity } from "@/lib/profanity";
import { locateByName, placeByCodes, placeKey, type PlaceMatch } from "@/lib/places";
import { SAMPLES } from "@/lib/samples";
import { resolveSkill, skillById } from "@/lib/skills";
import { daysLeft, photosForPlan, planById } from "@/lib/plans";
import { confirmPaidReference } from "@/lib/plans-api";
import { DOC_URL_MAX, PHOTO_BYTES_MAX, PHOTO_URL_MAX } from "@/lib/media";
import { requireAge } from "@/lib/hire-api";
import { randomId, sha256Hex } from "@/lib/ids";
import { CONSENT_VERSION, HIGH_RISK_SKILLS } from "@/lib/privacy";
import { applyLatestConsent } from "@/lib/privacy-api";
import { paystack, paystackConfigured } from "@/lib/pay/paystack";
import { providersForCountry } from "@/lib/pay/index";
import { methodById } from "@/lib/payments";

type ListingRow = {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  region_code: string;
  region_name: string;
  town_code: string;
  town_name: string;
  community_code: string;
  community_name: string;
  skill_id: string;
  skill_name: string;
  years: number;
  display_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  reach: string;
  contact_active: boolean | string | number;
  experience: string;
  photo: string;
  currency: string;
  fee_label: string;
  pay_reference: string;
  is_sample: boolean | string | number;
  views: number;
  plan_id: string;
  plan_status: string;
  plan_expires_at: string | null;
  language: string;
  visibility: string;
  consent_version: number;
  work_checked: boolean | string | number;
  review_status: string;
  hidden_reason: string;
  document_name: string;
};

const COLUMNS = `id, user_id, country_code, country_name, region_code, region_name,
  town_code, town_name, community_code, community_name, skill_id, skill_name,
  years, display_name, phone, whatsapp, email, facebook, instagram, twitter, tiktok, reach, contact_active, experience, photo,
  currency, fee_label, pay_reference, is_sample, views, plan_id, plan_status, plan_expires_at, language, visibility, consent_version, work_checked, review_status, hidden_reason, document_name`;

export type DraftInput = {
  adult: boolean;
  acceptDisclaimer: boolean;
  countryCode: string;
  regionCode: string;
  townCode: string;
  communityCode: string;
  skillId: string;
  skillName: string;
  years: number;
  displayName: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  whatsappSame: boolean;
  reach: string;
  contactActive: boolean;
  payMethod: string;
  experience: string;
  photo: string;
  photoNote?: string;
  photoMadeOn?: string;
  photo2?: string;
  photo2Note?: string;
  photo2MadeOn?: string;
  photo3?: string;
  photo3Note?: string;
  photo3MadeOn?: string;
  showsPeople?: boolean;
  hasPermission?: boolean;
  proofNote?: string;
  document?: string;
  documentName?: string;
  language?: string;
  origin: string;
};

type StoredDraft = {
  countryCode: string;
  regionCode: string;
  townCode: string;
  communityCode: string;
  skillId: string;
  skillName: string;
  years: number;
  displayName: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  reach: string;
  contactActive: boolean;
  payMethod: string;
  experience: string;
  photo: string;
  photoNote: string;
  photoMadeOn: string;
  photo2: string;
  photo2Note: string;
  photo2MadeOn: string;
  photo3: string;
  photo3Note: string;
  photo3MadeOn: string;
  showsPeople: boolean;
  hasPermission: boolean;
  proofNote: string;
  document: string;
  documentName: string;
};

export type SubmitData =
  | { status: "preview"; reference: string; feeLabel: string; payMethod: string; qr: boolean }
  | { status: "paystack"; authorizationUrl: string; reference: string; feeLabel: string; payMethod: string; qr: boolean }
  | { status: "published"; listing: PublicListing; updated: boolean };

export type ActionOk<T> = { ok: true; data: T };
export type ActionResult<T> = ActionOk<T> | { ok: false; error: string };

function extraPhoto(value: string | undefined, which: string): string {
  const photo = (value ?? "").trim();
  if (!photo) return "";
  if (!PHOTO_RE.test(photo)) throw new Error(`The ${which} photo must be a JPG, PNG, or WEBP.`);
  splitDataPhoto(photo);
  return photo;
}

function namedSkill(draft: StoredDraft): { id: string; name: string } | null {
  const listed = skillById(draft.skillId);
  if (listed) return listed;
  const name = draft.skillName?.trim();
  if (!draft.skillId || !name) return null;
  return { id: draft.skillId, name };
}

function asBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "t" || value === "true" || value === "1";
  return false;
}

function mapRow(row: ListingRow, reveal: boolean): PublicListing {
  const active = asBool(row.contact_active);
  const show = reveal || (active && !asBool(row.is_sample));
  return {
    id: row.id,
    countryCode: row.country_code,
    countryName: row.country_name,
    regionCode: row.region_code,
    regionName: row.region_name,
    townCode: row.town_code,
    townName: row.town_name,
    communityCode: row.community_code,
    communityName: row.community_name,
    skillId: row.skill_id,
    skillName: row.skill_name,
    years: Number(row.years),
    displayName: row.display_name,
    phone: reveal && row.phone ? row.phone : null,
    whatsapp: reveal && row.whatsapp ? row.whatsapp : null,
    email: reveal && row.email ? row.email : null,
    facebook: show && row.facebook ? row.facebook : null,
    instagram: show && row.instagram ? row.instagram : null,
    twitter: show && row.twitter ? row.twitter : null,
    tiktok: show && row.tiktok ? row.tiktok : null,
    reach: show && row.reach ? row.reach : null,
    contactActive: active,
    experience: row.experience,
    photo: row.photo,
    sample: asBool(row.is_sample),
    feeLabel: row.fee_label,
    views: Number(row.views ?? 0),
    planId: row.plan_id || "starter",
    planStatus: row.plan_status || "trial",
    daysLeft: daysLeft(row.plan_expires_at),
    badge: row.plan_status === "active" ? planById(row.plan_id || "starter").badge : null,
    listed:
      asBool(row.is_sample) ||
      (row.visibility === "public" && Number(row.consent_version) >= CONSENT_VERSION),
    language: row.language || "en",
    photos: row.photo ? [row.photo] : [],
    hiddenPhotoCount: 0,
    workChecked: asBool(row.work_checked),
    reviewStatus: row.review_status || "clear",
    hiddenReason: row.hidden_reason || "",
    staffVerified: false,
    documentName: row.document_name || "",
    restricted: false,
  };
}

function otherCountry(listing: PublicListing): PublicListing {
  return {
    ...listing,
    displayName: listing.skillName,
    regionCode: "",
    regionName: "",
    townCode: "",
    townName: "",
    communityCode: "",
    communityName: "",
    years: 0,
    phone: null,
    whatsapp: null,
    email: null,
    facebook: null,
    instagram: null,
    twitter: null,
    tiktok: null,
    reach: null,
    contactActive: false,
    experience: "",
    photo: "",
    photos: [],
    views: 0,
    documentName: "",
    workChecked: false,
    staffVerified: false,
    restricted: true,
  };
}

const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i;
const KEPT_PHOTO_RE = /^\/photos\/[A-Z0-9]+(?:-[A-Z0-9]+){4}$/;
const REFERENCE_RE = /^TTAP-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/;

function photoPath(id: string): string {
  return `/photos/${id}`;
}

function splitDataPhoto(photo: string): { mime: string; body: string } {
  const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i);
  if (!match || photo.length > PHOTO_URL_MAX) {
    throw new Error("Upload a JPG, PNG, or WEBP photo of your best work.");
  }
  const mime = match[1].toLowerCase();
  const body = match[2];
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((body.length * 3) / 4) - padding;
  if (bytes < 32 || bytes > PHOTO_BYTES_MAX) {
    throw new Error("That photo is too large. Try a simpler picture.");
  }
  const head = atob(body.slice(0, 24));
  const code = (index: number) => head.charCodeAt(index);
  const jpeg = code(0) === 0xff && code(1) === 0xd8;
  const png = code(0) === 0x89 && code(1) === 0x50;
  const webp = head.startsWith("RIFF") && head.slice(8, 12) === "WEBP";
  if ((mime === "image/jpeg" && !jpeg) || (mime === "image/png" && !png) || (mime === "image/webp" && !webp)) {
    throw new Error("That file is not a real photo.");
  }
  return { mime, body };
}

async function saveListingDocument(sql: Sql, listingId: string, draft: StoredDraft): Promise<void> {
  if (!draft.document) return;
  const match = draft.document.match(/^data:([^;]+);base64,([a-z0-9+/=]+)$/i);
  if (!match) return;
  await sql.query(
    `insert into listing_documents (listing_id, name, mime, body)
     values ($1, $2, $3, $4)
     on conflict (listing_id) do update set name = excluded.name, mime = excluded.mime, body = excluded.body`,
    [listingId, draft.documentName || "work-document", match[1].toLowerCase(), match[2]],
  );
  await sql.query("update listings set document_name = $2 where id = $1", [listingId, draft.documentName || "Work document"]);
}

async function saveListingPhoto(sql: Sql, listingId: string, photo: string): Promise<void> {
  const parts = splitDataPhoto(photo);
  await sql.query(
    `insert into listing_photos (listing_id, mime, body)
     values ($1, $2, $3)
     on conflict (listing_id) do update set mime = excluded.mime, body = excluded.body, updated_at = now()`,
    [listingId, parts.mime, parts.body],
  );
}

async function recordWorkPhoto(sql: Sql, listingId: string, draft: StoredDraft): Promise<void> {
  const shots = [
    { photo: draft.photo, note: draft.photoNote, madeOn: draft.photoMadeOn },
    { photo: draft.photo2, note: draft.photo2Note, madeOn: draft.photo2MadeOn },
    { photo: draft.photo3, note: draft.photo3Note, madeOn: draft.photo3MadeOn },
  ].filter((shot) => shot.photo);
  await sql.query("delete from photo_notes where listing_id = $1", [listingId]);
  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index];
    let sha = "";
    if (shot.photo.startsWith("data:")) {
      const parts = splitDataPhoto(shot.photo);
      sha = await sha256Hex(parts.body);
      if (index > 0) {
        await sql.query(
          `insert into listing_gallery (id, listing_id, position, mime, body)
           values ($1, $2, $3, $4, $5)
           on conflict (id) do update set mime = excluded.mime, body = excluded.body`,
          [`${listingId}-${index}`, listingId, index, parts.mime, parts.body],
        );
      }
    }
    await sql.query(
      "insert into photo_notes (listing_id, position, note, made_on, sha) values ($1, $2, $3, $4, $5)",
      [listingId, index, shot.note, shot.madeOn, sha],
    );
    if (!sha) continue;
    const dupes = await sql.query<{ listing_id: string }>(
      "select listing_id from photo_notes where sha = $1 and listing_id <> $2 limit 1",
      [sha, listingId],
    );
    if (dupes[0]) {
      await sql.query("insert into review_flags (id, listing_id, kind, detail) values ($1, $2, 'duplicate', $3)", [
        randomId(),
        listingId,
        dupes[0].listing_id,
      ]);
      await sql.query("update listings set review_status = 'queued' where id = $1", [listingId]);
    }
  }
  if (draft.proofNote && HIGH_RISK_SKILLS.includes(draft.skillId)) {
    await sql.query("update listings set proof_added = true where id = $1", [listingId]);
  }
  await refreshWorkChecked(sql, listingId);
}

async function refreshWorkChecked(sql: Sql, listingId: string): Promise<void> {
  const dated = await sql.query<{ n: number }>(
    "select count(*)::int as n from photo_notes where listing_id = $1 and made_on <> ''",
    [listingId],
  );
  const flags = await sql.query<{ n: number }>(
    "select count(*)::int as n from review_flags where listing_id = $1 and kind = 'duplicate'",
    [listingId],
  );
  const vouches = await sql.query<{ n: number }>("select count(*)::int as n from vouches where listing_id = $1", [listingId]);
  const hired = await sql.query<{ n: number }>(
    "select count(*)::int as n from job_confirms where listing_id = $1 and confirmed_at is not null",
    [listingId],
  );
  const status = await sql.query<{ review_status: string }>("select review_status from listings where id = $1", [listingId]);
  const passed = status[0]?.review_status === "approved" || Number(vouches[0]?.n ?? 0) >= 3 || Number(hired[0]?.n ?? 0) >= 5;
  const checked = Number(dated[0]?.n ?? 0) >= 3 && Number(flags[0]?.n ?? 0) === 0 && passed;
  await sql.query("update listings set work_checked = $2 where id = $1", [listingId, checked]);
}

async function guardSubmitRate(sql: Sql, userId: string): Promise<void> {
  await sql.query(`delete from submit_attempts where created_at < now() - interval '1 day'`);
  const rows = await sql.query<{ n: number }>(
    `select count(*)::int as n from submit_attempts
     where user_id = $1 and created_at > now() - interval '15 minutes'`,
    [userId],
  );
  if (Number(rows[0]?.n ?? 0) >= 8) {
    throw new Error("Too many attempts. Wait a few minutes and try again.");
  }
  await sql.query("insert into submit_attempts (user_id) values ($1)", [userId]);
}

async function dropStalePending(sql: Sql): Promise<void> {
  await sql.query(
    `delete from pending_photos where reference in (
      select reference from pending_listings where created_at < now() - interval '2 days'
    )`,
  );
  await sql.query(`delete from pending_listings where created_at < now() - interval '2 days'`);
}

function parseDraft(input: DraftInput): { draft: StoredDraft; place: PlaceMatch; feeLabel: string; feeMinor: number; currency: string } {
  if (input.adult !== true) {
    throw new Error("Talent Finder only lists adults. Confirm that you are 18 or older.");
  }
  if (input.acceptDisclaimer !== true) {
    throw new Error("Read the due diligence notice and confirm it before publishing.");
  }
  const place = placeByCodes(input.countryCode, input.regionCode, input.townCode, input.communityCode);
  if (!place) throw new Error("Choose a country, region, town, and community from the lists.");
  const skill = resolveSkill(input.skillId, input.skillName ?? "");
  if (!skill) throw new Error("Type your skill, or pick one from the list. You can change it later.");
  const years = Number(input.years);
  if (!Number.isInteger(years) || years < 0 || years > 50) {
    throw new Error("Years of experience must be a whole number from 0 to 50.");
  }
  const displayName = cleanName(input.displayName);
  if (!displayName) throw new Error("Enter the name clients should see. Letters, spaces, and hyphens only.");
  const method = methodById(input.countryCode, input.payMethod);
  if (!method) throw new Error("Choose a Paystack method for your country.");
  const phoneRaw = (input.phone ?? "").trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw, place.country.dial) : "";
  if (phoneRaw && !phone) throw new Error(`That is not a working ${place.country.name} phone number.`);
  const emailRaw = (input.email ?? "").trim();
  const email = emailRaw ? cleanEmail(emailRaw) : null;
  if (emailRaw && !email) throw new Error("That email does not look valid.");
  const facebook = cleanSocial(input.facebook ?? "", ["facebook.com", "fb.com", "m.facebook.com"], "Facebook");
  const instagram = cleanSocial(input.instagram ?? "", ["instagram.com"], "Instagram");
  const twitter = cleanSocial(input.twitter ?? "", ["x.com", "twitter.com"], "X");
  const tiktok = cleanSocial(input.tiktok ?? "", ["tiktok.com"], "TikTok");
  const reach = cleanReach(input.reach ?? "");
  const experience = input.experience.replace(/\s+/g, " ").trim();
  if (experience.length < 40 || experience.length > 800) {
    throw new Error("Describe your work in 40 to 800 characters.");
  }
  const photo = input.photo.trim();
  if (!PHOTO_RE.test(photo) && !KEPT_PHOTO_RE.test(photo)) {
    throw new Error("Upload a JPG, PNG, or WEBP photo of your best work.");
  }
  if (photo.startsWith("data:")) splitDataPhoto(photo);
  if (input.showsPeople === true && input.hasPermission !== true) {
    throw new Error("If the photo shows a face, a child, a customer, or a private home, confirm you have permission. Otherwise use a photo of the work only.");
  }
  const photoNote = (input.photoNote ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  const photoMadeOn = /^\d{4}-\d{2}-\d{2}$/.test(input.photoMadeOn ?? "") ? input.photoMadeOn ?? "" : "";
  const proofNote = (input.proofNote ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
  const documentName = (input.documentName ?? "").replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  const document = (input.document ?? "").trim();
  if (document) {
    const pdf = document.startsWith("data:application/pdf;base64,");
    const image = PHOTO_RE.test(document);
    if (!image || document.length > DOC_URL_MAX) {
      throw new Error("Add a real photo of the work. Use a JPG, PNG, or WEBP.");
    }
  }
  const text = [displayName, experience, reach, email ?? "", facebook, instagram, twitter, tiktok, skill.name].join("\n");
  if (hasProfanity(text)) {
    throw new Error("That text is not allowed on Talent Finder. Rewrite it without profanity or sexual content.");
  }
  return {
    place,
    feeLabel: place.country.feeLabel,
    feeMinor: place.country.feeMinor,
    currency: place.country.currency,
    draft: {
      countryCode: place.country.code,
      regionCode: place.region.code,
      townCode: place.town.code,
      communityCode: place.community.code,
      skillId: skill.id,
      skillName: skill.name,
      years,
      displayName,
      phone: phone || "",
      email,
      whatsapp: input.whatsappSame === true && phone ? phone : null,
      facebook,
      instagram,
      twitter,
      tiktok,
      reach,
      contactActive: input.contactActive === true && Boolean(phone || email || facebook || instagram || twitter || tiktok || reach),
      payMethod: method.id,
      experience,
      photo,
      photoNote,
      photoMadeOn,
      photo2: extraPhoto(input.photo2, "second"),
      photo2Note: (input.photo2Note ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
      photo2MadeOn: /^\d{4}-\d{2}-\d{2}$/.test(input.photo2MadeOn ?? "") ? input.photo2MadeOn ?? "" : "",
      photo3: extraPhoto(input.photo3, "third"),
      photo3Note: (input.photo3Note ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
      photo3MadeOn: /^\d{4}-\d{2}-\d{2}$/.test(input.photo3MadeOn ?? "") ? input.photo3MadeOn ?? "" : "",
      showsPeople: input.showsPeople === true,
      hasPermission: input.hasPermission === true,
      proofNote,
      document,
      documentName,
    },
  };
}

async function reviewWithModel(draft: StoredDraft): Promise<void> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return;
  const content: unknown[] = [
    {
      type: "text",
      text: `You moderate Talent Finder, a public directory of tradespeople. Reply with JSON only: {"allow":true} or {"allow":false}. Reject nudity, sexual content, gore, hate, slurs, profanity, scam pitches, and private or degrading photos of people. Allow ordinary trade descriptions and real photos of tools, rooms, hair, clothing, food, vehicles, and construction.\n\nName: ${draft.displayName.slice(0, 80)}\nExperience: ${draft.experience.slice(0, 900)}`,
    },
  ];
  if (draft.photo.startsWith("data:image/")) {
    content.push({ type: "image_url", image_url: { url: draft.photo } });
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0,
          max_tokens: 40,
          messages: [{ role: "user", content }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]) as { allow?: boolean };
      if (parsed.allow === true) return;
      if (parsed.allow === false) {
        throw new Error(
          "We rejected this photo or description. Use a real photo of the work, and remove anything profane, sexual, or violent.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("We rejected")) throw error;
    }
  }
  throw new Error("We could not review this submission. Please try again in a moment.");
}

async function ensureSamples(sql: Sql) {
  const flag = globalThis as typeof globalThis & { __talentTapSeeded?: boolean; __talentChecked?: boolean };
  if (!flag.__talentTapSeeded) {
  for (const sample of SAMPLES) {
    const place = locateByName(
      sample.countryCode,
      sample.regionCode,
      sample.townName,
      sample.communityName,
    );
    const skill = skillById(sample.skillId);
    if (!place || !skill) continue;
    const id = `${placeKey(place)}-0001`;
    await sql.query(
      `insert into listings (
        id, user_id, country_code, country_name, region_code, region_name,
        town_code, town_name, community_code, community_name, skill_id, skill_name,
        years, display_name, phone, whatsapp, email, reach, contact_active, experience,
        photo, currency, fee_label, pay_reference, is_sample
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,true
      ) on conflict (id) do update set reach = excluded.reach
        where listings.is_sample = true and listings.reach = ''`,
      [
        id,
        `seed:${id}`,
        place.country.code,
        place.country.name,
        place.region.code,
        place.region.name,
        place.town.code,
        place.town.name,
        place.community.code,
        place.community.name,
        skill.id,
        skill.name,
        sample.years,
        sample.displayName,
        "",
        null,
        null,
        "Sample profile. No phone or email is listed.",
        true,
        sample.experience,
        sample.photo,
        place.country.currency,
        place.country.feeLabel,
        `SAMPLE-${id}`,
      ],
    );
    await sql.query(
      `insert into id_counters (place_key, n) values ($1, 1)
       on conflict (place_key) do update set n = greatest(id_counters.n, 1)`,
      [placeKey(place)],
    );
  }
  flag.__talentTapSeeded = true;
  }
  if (!flag.__talentChecked) {
    await markCheckedSample(sql);
    flag.__talentChecked = true;
  }
}

async function markCheckedSample(sql: Sql): Promise<void> {
  const id = "GH-GA-ACC-OSU-0001";
  const notes = [
    ["Kitchen walls, Osu, finished for a family", "2024-03-12"],
    ["Gate and rail, Labone", "2025-06-02"],
    ["Office interior, Cantonments", "2026-01-18"],
  ];
  for (let index = 0; index < notes.length; index += 1) {
    await sql.query(
      `insert into photo_notes (listing_id, position, note, made_on, sha)
       values ($1, $2, $3, $4, $5)
       on conflict (listing_id, position) do update set note = excluded.note, made_on = excluded.made_on, sha = excluded.sha`,
      [id, index, notes[index][0], notes[index][1], `sample-${id}-${index}`],
    );
  }
  await sql.query(
    "update listings set review_status = 'approved', work_checked = true where id = $1 and is_sample = true",
    [id],
  );
}

async function rowByUser(sql: Sql, userId: string): Promise<ListingRow | null> {
  const rows = await sql.query<ListingRow>(
    `select ${COLUMNS} from listings where user_id = $1 and is_sample = false limit 1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function rowByReference(sql: Sql, reference: string): Promise<ListingRow | null> {
  const rows = await sql.query<ListingRow>(
    `select ${COLUMNS} from listings where pay_reference = $1 limit 1`,
    [reference],
  );
  return rows[0] ?? null;
}

async function allocateId(sql: Sql, key: string): Promise<string> {
  const rows = await sql.query<{ n: number }>(
    `insert into id_counters (place_key, n) values ($1, 1)
     on conflict (place_key) do update set n = id_counters.n + 1
     returning n`,
    [key],
  );
  const n = Number(rows[0]?.n ?? 1);
  return `${key}-${String(n).padStart(4, "0")}`;
}

async function insertFromDraft(
  sql: Sql,
  userId: string,
  draft: StoredDraft,
  reference: string,
): Promise<PublicListing> {
  const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
  const skill = namedSkill(draft);
  if (!place || !skill) throw new Error("This listing is no longer valid. Start again.");
  const existingRef = await rowByReference(sql, reference);
  if (existingRef) return mapRow(existingRef, existingRef.user_id === userId);
  const owned = await rowByUser(sql, userId);
  if (owned) return mapRow(owned, true);
  const id = await allocateId(sql, placeKey(place));
  if (!draft.photo.startsWith("data:")) {
    throw new Error("Upload a JPG, PNG, or WEBP photo of your best work.");
  }
  try {
    await sql.query(
      `insert into listings (
        id, user_id, country_code, country_name, region_code, region_name,
        town_code, town_name, community_code, community_name, skill_id, skill_name,
        years, display_name, phone, whatsapp, email, facebook, instagram, twitter, tiktok, reach, contact_active, experience,
        photo, currency, fee_label, pay_reference, is_sample
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,false
      )`,
      [
        id,
        userId,
        place.country.code,
        place.country.name,
        place.region.code,
        place.region.name,
        place.town.code,
        place.town.name,
        place.community.code,
        place.community.name,
        skill.id,
        skill.name,
        draft.years,
        draft.displayName,
        draft.phone,
        draft.whatsapp,
        draft.email,
        draft.facebook,
        draft.instagram,
        draft.twitter,
        draft.tiktok,
        draft.reach,
        draft.contactActive,
        draft.experience,
        photoPath(id),
        place.country.currency,
        place.country.feeLabel,
        reference,
      ],
    );
    await saveListingPhoto(sql, id, draft.photo);
    await saveListingDocument(sql, id, draft);
    await recordWorkPhoto(sql, id, draft);
  } catch {
    await sql.query("delete from listing_photos where listing_id = $1", [id]);
    await sql.query("delete from listings where id = $1 and user_id = $2", [id, userId]);
    const again = (await rowByReference(sql, reference)) ?? (await rowByUser(sql, userId));
    if (again) return mapRow(again, again.user_id === userId);
    throw new Error("Could not publish the listing. Try again.");
  }
  const created = await rowByUser(sql, userId);
  if (!created) throw new Error("Could not publish the listing. Try again.");
  await applyLatestConsent(userId);
  const fresh = await rowByUser(sql, userId);
  return mapRow(fresh ?? created, true);
}

async function updateOwned(sql: Sql, userId: string, draft: StoredDraft): Promise<PublicListing> {
  const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
  const skill = namedSkill(draft);
  if (!place || !skill) throw new Error("Choose a place and skill from the lists.");
  const current = await rowByUser(sql, userId);
  if (!current) throw new Error("Could not update your listing.");
  let photo = current.photo;
  if (draft.photo.startsWith("data:")) {
    await saveListingPhoto(sql, current.id, draft.photo);
    await saveListingDocument(sql, current.id, draft);
    await recordWorkPhoto(sql, current.id, draft);
    photo = photoPath(current.id);
  }
  await sql.query(
    `update listings set
      country_code = $1, country_name = $2, region_code = $3, region_name = $4,
      town_code = $5, town_name = $6, community_code = $7, community_name = $8,
      skill_id = $9, skill_name = $10, years = $11, display_name = $12,
      phone = $13, whatsapp = $14, email = $15, facebook = $16, instagram = $17, twitter = $18, tiktok = $19,
      reach = $20, contact_active = $21, experience = $22, photo = $23, currency = $24, fee_label = $25
     where user_id = $26 and is_sample = false`,
    [
      place.country.code,
      place.country.name,
      place.region.code,
      place.region.name,
      place.town.code,
      place.town.name,
      place.community.code,
      place.community.name,
      skill.id,
      skill.name,
      draft.years,
      draft.displayName,
      draft.phone,
      draft.whatsapp,
      draft.email,
      draft.facebook,
      draft.instagram,
      draft.twitter,
      draft.tiktok,
      draft.reach,
      draft.contactActive,
      draft.experience,
      photo,
      place.country.currency,
      place.country.feeLabel,
      userId,
    ],
  );
  const row = await rowByUser(sql, userId);
  if (!row) throw new Error("Could not update your listing.");
  await applyLatestConsent(userId);
  const fresh = await rowByUser(sql, userId);
  return mapRow(fresh ?? row, true);
}

export const keepDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DraftInput) => input)
  .handler(async ({ data, context }): Promise<ActionResult<PublicListing>> => {
    try {
      const parsed = parseDraft(data);
      const sql = await getSql();
      await requireAge(context.userId);
      const owned = await rowByUser(sql, context.userId);
      if (owned) await updateOwned(sql, context.userId, parsed.draft);
      else await insertFromDraft(sql, context.userId, parsed.draft, `DRAFT-${Date.now().toString(36)}`.toUpperCase());
      await sql.query(
        "update listings set visibility = 'draft', consent_version = 0 where user_id = $1 and is_sample = false",
        [context.userId],
      );
      const row = await rowByUser(sql, context.userId);
      if (!row) return { ok: false, error: "Could not save the draft." };
      return { ok: true, data: mapRow(row, true) };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

function callbackUrl(origin: string): string {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error("Could not start payment.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Could not start payment.");
  }
  return `${url.origin}/pay/callback`;
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}

export const searchListings = createServerFn({ method: "POST" })
  .validator((input: {
    country?: string;
    region?: string;
    town?: string;
    skill?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) => input ?? {})
  .handler(async ({ data }): Promise<ActionResult<{ listings: PublicListing[]; total: number }>> => {
    try {
      const sql = await getSql();
      await ensureSamples(sql);
      const where = ["(is_sample = true or (visibility = 'public' and consent_version >= " + CONSENT_VERSION + "))", "not exists (select 1 from account_admin where account_admin.user_id = listings.user_id and account_admin.removed = true)"];
      const params: unknown[] = [];
      const add = (column: string, value: string | undefined) => {
        const clean = (value ?? "").trim();
        if (!clean) return;
        params.push(clean);
        where.push(`${column} = $${params.length}`);
      };
      add("country_code", data.country);
      add("region_code", data.region);
      add("town_code", data.town);
      add("skill_id", data.skill);
      const q = (data.q ?? "").trim().slice(0, 80);
      if (q) {
        params.push(`%${q.replace(/[%_\\]/g, "")}%`);
        const slot = `$${params.length}`;
        where.push(
          `(display_name ilike ${slot} or skill_name ilike ${slot} or town_name ilike ${slot} or community_name ilike ${slot} or id ilike ${slot})`,
        );
      }
      const limit = Math.min(24, Math.max(1, Math.floor(Number(data.limit) || 12)));
      const offset = Math.min(5000, Math.max(0, Math.floor(Number(data.offset) || 0)));
      const clause = where.join(" and ");
      params.push(limit, offset);
      const rows = await sql.query<ListingRow & { total_count: number }>(
        `select ${COLUMNS}, count(*) over()::int as total_count
         from listings where ${clause}
         order by is_sample asc, views desc, id desc
         limit $${params.length - 1} offset $${params.length}`,
        params,
      );
      return {
        ok: true,
        data: {
          listings: rows.map((row) => mapRow(row, false)),
          total: Number(rows[0]?.total_count ?? 0),
        },
      };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const countryBoard = createServerFn({ method: "POST" })
  .validator((input: { country?: string; skill?: string }) => input ?? {})
  .handler(async ({ data }): Promise<ActionResult<{
    listings: PublicListing[];
    skills: { id: string; name: string; count: number }[];
  }>> => {
    try {
      const country = (data.country ?? "").trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) return { ok: false, error: "Choose a country." };
      const sql = await getSql();
      await ensureSamples(sql);
      const params: unknown[] = [country];
      const skill = (data.skill ?? "").trim().slice(0, 48);
      const skillClause = skill ? ` and skill_id = $2` : "";
      if (skill) params.push(skill);
      const rows = await sql.query<ListingRow>(
        `select ${COLUMNS} from listings
         where country_code = $1${skillClause}
           and (is_sample = true or (visibility = 'public' and consent_version >= ${CONSENT_VERSION} and on_boards = true))
           and not exists (select 1 from account_admin where account_admin.user_id = listings.user_id and account_admin.removed = true)
         order by views desc, is_sample asc, id desc
         limit 48`,
        params,
      );
      const skills = await sql.query<{ skill_id: string; skill_name: string; n: number }>(
        `select skill_id, skill_name, count(*)::int as n
         from listings where country_code = $1
         group by skill_id, skill_name
         order by count(*) desc, skill_name asc`,
        [country],
      );
      return {
        ok: true,
        data: {
          listings: rows.map((row) => mapRow(row, false)),
          skills: skills.map((row) => ({ id: row.skill_id, name: row.skill_name, count: Number(row.n) })),
        },
      };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const getListing = createServerFn({ method: "POST" })
  .validator((input: { id: string; count?: boolean; viewerCountry?: string }) => input)
  .handler(async ({ data }): Promise<ActionResult<PublicListing | null>> => {
    try {
      const id = (data.id ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/.test(id)) {
        return { ok: true, data: null };
      }
      const viewer = (data.viewerCountry ?? "").trim().toUpperCase();
      const sql = await getSql();
      await ensureSamples(sql);
      const found = await sql.query<ListingRow>(`select ${COLUMNS} from listings where id = $1 limit 1`, [id]);
      const row = found[0];
      if (!row) return { ok: true, data: null };
      const abroad = /^[A-Z]{2}$/.test(viewer) && viewer !== row.country_code;
      const rows = data.count && !abroad
        ? await sql.query<ListingRow>(`update listings set views = views + 1 where id = $1 returning ${COLUMNS}`, [id])
        : found;
      let listing = rows[0] ? mapRow(rows[0], false) : null;
      if (listing && !listing.sample && !listing.listed) return { ok: true, data: null };
      if (listing && rows[0] && !listing.sample) {
        const flags = await sql.query<{ verified: boolean; removed: boolean }>(
          "select verified, removed from account_admin where user_id = $1 limit 1",
          [rows[0].user_id],
        );
        if (flags[0]?.removed) return { ok: true, data: null };
        listing.staffVerified = Boolean(flags[0]?.verified);
      }
      if (listing && /^[A-Z]{2}$/.test(viewer) && viewer !== listing.countryCode) {
        listing = otherCountry(listing);
      }
      return { ok: true, data: listing };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const getMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ActionResult<PublicListing | null>> => {
    try {
      const sql = await getSql();
      await ensureSamples(sql);
      const row = await rowByUser(sql, context.userId);
      return { ok: true, data: row ? mapRow(row, true) : null };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

type SignupContact = { phone: string; facebook: string; instagram: string; tiktok: string; twitter: string };

function loosePhone(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new Error("Enter a phone number, or leave it blank.");
  return raw.startsWith("+") ? `+${digits}` : digits;
}

function parseSignupContact(input: SignupContact): SignupContact {
  return {
    phone: loosePhone(input.phone ?? ""),
    facebook: cleanSocial(input.facebook ?? "", ["facebook.com", "fb.com", "m.facebook.com"], "Facebook"),
    instagram: cleanSocial(input.instagram ?? "", ["instagram.com"], "Instagram"),
    tiktok: cleanSocial(input.tiktok ?? "", ["tiktok.com"], "TikTok"),
    twitter: cleanSocial(input.twitter ?? "", ["x.com", "twitter.com"], "X"),
  };
}

export const saveSignupContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SignupContact) => input)
  .handler(async ({ data, context }): Promise<ActionResult<SignupContact>> => {
    try {
      const contact = parseSignupContact(data);
      const sql = await getSql();
      await sql.query(
        `insert into user_contacts (user_id, phone, facebook, instagram, tiktok, twitter)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (user_id) do update set
           phone = excluded.phone, facebook = excluded.facebook,
           instagram = excluded.instagram, tiktok = excluded.tiktok, twitter = excluded.twitter`,
        [context.userId, contact.phone, contact.facebook, contact.instagram, contact.tiktok, contact.twitter],
      );
      return { ok: true, data: contact };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const getSignupContact = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ActionResult<SignupContact | null>> => {
    try {
      const sql = await getSql();
      const rows = await sql.query<SignupContact>(
        "select phone, facebook, instagram, tiktok, twitter from user_contacts where user_id = $1 limit 1",
        [context.userId],
      );
      return { ok: true, data: rows[0] ?? null };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const submitListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DraftInput) => input)
  .handler(async ({ data, context }): Promise<ActionResult<SubmitData>> => {
    try {
      const parsed = parseDraft(data);
      const sql = await getSql();
      await requireAge(context.userId);
      await ensureSamples(sql);
      await dropStalePending(sql);
      await guardSubmitRate(sql, context.userId);
      const owned = await rowByUser(sql, context.userId);
      const unchanged =
        owned &&
        owned.photo === parsed.draft.photo &&
        owned.experience === parsed.draft.experience &&
        owned.display_name === parsed.draft.displayName &&
        owned.reach === parsed.draft.reach &&
        owned.phone === parsed.draft.phone &&
        (owned.email ?? "") === (parsed.draft.email ?? "");
      if (!unchanged) await reviewWithModel(parsed.draft);
      if (owned) {
        const listing = await updateOwned(sql, context.userId, parsed.draft);
        return { ok: true, data: { status: "published", listing, updated: true } };
      }
      const reference = `TTAP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
      const parts = splitDataPhoto(parsed.draft.photo);
      await sql.query(
        `delete from pending_photos where reference in (select reference from pending_listings where user_id = $1)`,
        [context.userId],
      );
      await sql.query("delete from pending_listings where user_id = $1", [context.userId]);
      await sql.query(
        "insert into pending_listings (reference, user_id, payload) values ($1, $2, $3)",
        [reference, context.userId, JSON.stringify({ ...parsed.draft, photo: "" })],
      );
      await sql.query(
        "insert into pending_photos (reference, mime, body) values ($1, $2, $3)",
        [reference, parts.mime, parts.body],
      );
      const method = methodById(parsed.draft.countryCode, parsed.draft.payMethod);
      if (!method) return { ok: false, error: "Choose a payment method for your country." };
      if (providersForCountry(parsed.draft.countryCode).length === 0) {
        const listing = await insertFromDraft(sql, context.userId, parsed.draft, reference);
        await clearPending(sql, reference);
        return { ok: true, data: { status: "published", listing, updated: false } };
      }
      const accountRows = await sql.query<{ email: string }>(
        `select email from "user" where id = $1 limit 1`,
        [context.userId],
      );
      const accountEmail = cleanEmail(accountRows[0]?.email ?? "");
      const privateEmail = accountEmail && !accountEmail.endsWith("@viewer.grok.invalid") ? accountEmail : null;
      const email = privateEmail || parsed.draft.email || accountEmail;
      if (!email) return { ok: false, error: "Add an email before paying." };
      const checkout = await paystack.createCheckout({
        reference,
        userId: context.userId,
        country: parsed.draft.countryCode,
        kind: "listing",
        planId: null,
        amount: parsed.feeMinor,
        currency: parsed.currency,
        email,
        description: parsed.feeLabel,
        callbackUrl: callbackUrl(data.origin),
        channel: method.channel,
      });
      if (!checkout.ok) return { ok: false, error: checkout.error };
      if (!(await paystackConfigured())) {
        return {
          ok: true,
          data: {
            status: "preview",
            reference,
            feeLabel: parsed.feeLabel,
            payMethod: method.id,
            qr: method.channel === "qr",
          },
        };
      }
      return {
        ok: true,
        data: {
          status: "paystack",
          authorizationUrl: checkout.url,
          reference,
          feeLabel: parsed.feeLabel,
          payMethod: method.id,
          qr: method.channel === "qr",
        },
      };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

async function pendingDraft(sql: Sql, reference: string, userId: string): Promise<StoredDraft | null> {
  if (!REFERENCE_RE.test(reference)) return null;
  const pending = await sql.query<{ payload: string; user_id: string }>(
    "select payload, user_id from pending_listings where reference = $1 limit 1",
    [reference],
  );
  const row = pending[0];
  if (!row || row.user_id !== userId) return null;
  const photos = await sql.query<{ mime: string; body: string }>(
    "select mime, body from pending_photos where reference = $1 limit 1",
    [reference],
  );
  const photo = photos[0];
  if (!photo) return null;
  const draft = JSON.parse(row.payload) as StoredDraft;
  draft.photo = `data:${photo.mime};base64,${photo.body}`;
  return draft;
}

async function clearPending(sql: Sql, reference: string): Promise<void> {
  await sql.query("delete from pending_photos where reference = $1", [reference]);
  await sql.query("delete from pending_listings where reference = $1", [reference]);
}

export const confirmPreview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reference: string }) => input)
  .handler(async ({ data, context }): Promise<ActionResult<PublicListing>> => {
    try {
      if (await paystackConfigured()) {
        return { ok: false, error: "Finish this payment on Paystack." };
      }
      const reference = (data.reference ?? "").trim().toUpperCase();
      const sql = await getSql();
      const draft = await pendingDraft(sql, reference, context.userId);
      if (!draft) return { ok: false, error: "This checkout expired. Submit the listing again." };
      const listing = await insertFromDraft(sql, context.userId, draft, reference);
      await clearPending(sql, reference);
      return { ok: true, data: listing };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const finalizePaystack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reference: string }) => input)
  .handler(async ({ data, context }): Promise<ActionResult<PublicListing>> => {
    try {
      const reference = (data.reference ?? "").trim().toUpperCase();
      const sql = await getSql();
      const already = await rowByReference(sql, reference);
      if (already && already.user_id === context.userId) return { ok: true, data: mapRow(already, true) };
      return { ok: false, error: "Confirming payment" };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export async function fulfillPaidListing(reference: string): Promise<void> {
  const sql = await getSql();
  const already = await rowByReference(sql, reference);
  if (already) return;
  const pending = await sql.query<{ payload: string; user_id: string }>(
    "select payload, user_id from pending_listings where reference = $1 limit 1",
    [reference],
  );
  const row = pending[0];
  if (!row) return;
  const photos = await sql.query<{ mime: string; body: string }>(
    "select mime, body from pending_photos where reference = $1 limit 1",
    [reference],
  );
  const photo = photos[0];
  if (!photo) return;
  const draft = JSON.parse(row.payload) as StoredDraft;
  draft.photo = `data:${photo.mime};base64,${photo.body}`;
  const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
  if (!place) return;
  const verified = await paystack.verifyPayment(reference);
  if (!verified.ok) return;
  if (verified.amount !== place.country.feeMinor || verified.currency !== place.country.currency) return;
  await insertFromDraft(sql, row.user_id, draft, reference);
  await clearPending(sql, reference);
}
