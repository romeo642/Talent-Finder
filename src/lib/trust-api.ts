import { createServerFn } from "@tanstack/react-start";
import { PHOTO_BYTES_MAX, PHOTO_URL_MAX } from "@/lib/media";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { cleanName } from "@/lib/directory";
import { hasProfanity } from "@/lib/profanity";

export type Vouch = { id: string; kind: "association" | "school" | "employer"; orgName: string; note: string };
export type PassedTest = { id: string; skillName: string; photo: string };
export type Passport = { confirms: number; vouches: Vouch[]; tests: PassedTest[] };

const TOKEN_RE = /^[a-f0-9]{24}$/;
const TEST_ID_RE = /^PT[A-Z0-9]{10}$/;
const LISTING_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/;
const KINDS = new Set(["association", "school", "employer"]);

export function practicalTestApplies(skillId: string, skillName: string): boolean {
  if (["welder", "tailor", "seamstress", "electrician", "auto-electrician"].includes(skillId)) return true;
  return /weld|tailor|electric|seamstress/i.test(skillName);
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}

function token(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function testId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `PT${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function photoParts(photo: string): { mime: string; body: string } {
  const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i);
  if (!match || photo.length > PHOTO_URL_MAX) throw new Error("Upload a JPG, PNG, or WEBP photo of the task.");
  const mime = match[1].toLowerCase();
  const body = match[2];
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((body.length * 3) / 4) - padding;
  if (bytes < 32 || bytes > PHOTO_BYTES_MAX) throw new Error("That photo is too large. Try a slightly smaller picture.");
  return { mime, body };
}

async function ownedListing(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ id: string; skill_id: string; skill_name: string; display_name: string; is_sample: boolean | string | number }>(
    "select id, skill_id, skill_name, display_name, is_sample from listings where user_id = $1 and is_sample = false limit 1",
    [userId],
  );
  return { sql, listing: rows[0] ?? null };
}

export const getPassport = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => input ?? {})
  .handler(async ({ data }): Promise<{ ok: true; data: Passport } | { ok: false; error: string }> => {
    try {
      const id = (data.id ?? "").trim().toUpperCase();
      const empty: Passport = { confirms: 0, vouches: [], tests: [] };
      if (!LISTING_RE.test(id)) return { ok: true, data: empty };
      const sql = await getSql();
      const confirms = await sql.query<{ n: number }>(
        "select count(*)::int as n from job_confirms where listing_id = $1 and confirmed_at is not null",
        [id],
      );
      const vouches = await sql.query<{ id: string; kind: string; org_name: string; note: string }>(
        "select id, kind, org_name, note from vouches where listing_id = $1 order by created_at desc limit 12",
        [id],
      );
      const tests = await sql.query<{ id: string; skill_name: string }>(
        "select id, skill_name from practical_tests where listing_id = $1 and status = 'passed' order by reviewed_at desc limit 3",
        [id],
      );
      return {
        ok: true,
        data: {
          confirms: Number(confirms[0]?.n ?? 0),
          vouches: vouches
            .filter((row) => KINDS.has(row.kind))
            .map((row) => ({
              id: row.id,
              kind: row.kind as Vouch["kind"],
              orgName: row.org_name,
              note: row.note,
            })),
          tests: tests.map((row) => ({ id: row.id, skillName: row.skill_name, photo: `/photos/test/${row.id}` })),
        },
      };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const createJobConfirm = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; data: { token: string } } | { ok: false; error: string }> => {
    try {
      const { sql, listing } = await ownedListing(context.userId);
      if (!listing) return { ok: false, error: "Publish your ID before you ask a client to confirm a job." };
      const value = token();
      await sql.query("insert into job_confirms (token, listing_id) values ($1, $2)", [value, listing.id]);
      return { ok: true, data: { token: value } };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const readJobConfirm = createServerFn({ method: "POST" })
  .validator((input: { token?: string }) => input ?? {})
  .handler(async ({ data }) => {
    try {
      const value = (data.token ?? "").trim().toLowerCase();
      if (!TOKEN_RE.test(value)) return { ok: false as const, error: "This confirmation link is not valid." };
      const sql = await getSql();
      const rows = await sql.query<{ confirmed_at: string | null; display_name: string; skill_name: string; town_name: string }>(
        `select c.confirmed_at, l.display_name, l.skill_name, l.town_name
         from job_confirms c join listings l on l.id = c.listing_id
         where c.token = $1 limit 1`,
        [value],
      );
      const row = rows[0];
      if (!row) return { ok: false as const, error: "This confirmation link is not valid." };
      return {
        ok: true as const,
        data: {
          confirmed: Boolean(row.confirmed_at),
          name: row.display_name,
          skill: row.skill_name,
          town: row.town_name,
        },
      };
    } catch (error) {
      return { ok: false as const, error: messageOf(error) };
    }
  });

export const confirmJob = createServerFn({ method: "POST" })
  .validator((input: { token?: string }) => input ?? {})
  .handler(async ({ data }): Promise<{ ok: true; data: { already: boolean } } | { ok: false; error: string }> => {
    try {
      const value = (data.token ?? "").trim().toLowerCase();
      if (!TOKEN_RE.test(value)) return { ok: false, error: "This confirmation link is not valid." };
      const sql = await getSql();
      const updated = await sql.query<{ token: string }>(
        "update job_confirms set confirmed_at = now() where token = $1 and confirmed_at is null returning token",
        [value],
      );
      if (updated[0]) return { ok: true, data: { already: false } };
      const existing = await sql.query<{ token: string }>("select token from job_confirms where token = $1 limit 1", [value]);
      if (!existing[0]) return { ok: false, error: "This confirmation link is not valid." };
      return { ok: true, data: { already: true } };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const addVouch = createServerFn({ method: "POST" })
  .validator((input: { id?: string; kind?: string; orgName?: string; note?: string }) => input ?? {})
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const id = (data.id ?? "").trim().toUpperCase();
      if (!LISTING_RE.test(id)) return { ok: false, error: "That ID is not valid." };
      const kind = (data.kind ?? "").trim();
      if (!KINDS.has(kind)) return { ok: false, error: "Choose an association, a school, or a past employer." };
      const orgName = cleanName(data.orgName ?? "");
      if (!orgName) return { ok: false, error: "Enter the name of the association, school, or employer." };
      const note = (data.note ?? "").replace(/\s+/g, " ").trim();
      if (note.length < 20 || note.length > 280) {
        return { ok: false, error: "Write 20 to 280 characters about why you vouch for this person." };
      }
      if (hasProfanity(`${orgName}\n${note}`)) {
        return { ok: false, error: "That text is not allowed. Rewrite it without profanity." };
      }
      const sql = await getSql();
      const live = await sql.query<{ id: string }>(
        "select id from listings where id = $1 and is_sample = false limit 1",
        [id],
      );
      if (!live[0]) return { ok: false, error: "That ID is not open for a vouch." };
      const count = await sql.query<{ n: number }>("select count(*)::int as n from vouches where listing_id = $1", [id]);
      if (Number(count[0]?.n ?? 0) >= 12) return { ok: false, error: "This ID already has the maximum number of vouches." };
      const dup = await sql.query<{ id: string }>(
        "select id from vouches where listing_id = $1 and lower(org_name) = lower($2) limit 1",
        [id, orgName],
      );
      if (dup[0]) return { ok: false, error: "That organisation has already vouched for this person." };
      await sql.query("insert into vouches (id, listing_id, kind, org_name, note) values ($1, $2, $3, $4, $5)", [
        token(),
        id,
        kind,
        orgName,
        note,
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const startPracticalTest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { photo?: string }) => input ?? {})
  .handler(async ({ data, context }): Promise<{ ok: true; data: { token: string } } | { ok: false; error: string }> => {
    try {
      const { sql, listing } = await ownedListing(context.userId);
      if (!listing) return { ok: false, error: "Publish your ID before you submit a practical test." };
      if (!practicalTestApplies(listing.skill_id, listing.skill_name)) {
        return { ok: false, error: "A practical test is open for welding, tailoring, and electrical work." };
      }
      const passed = await sql.query<{ id: string }>(
        "select id from practical_tests where listing_id = $1 and status = 'passed' limit 1",
        [listing.id],
      );
      if (passed[0]) return { ok: false, error: "A trainer has already passed your practical test." };
      const pending = await sql.query<{ token: string }>(
        "select token from practical_tests where listing_id = $1 and status = 'pending' order by created_at desc limit 1",
        [listing.id],
      );
      if (pending[0]) return { ok: true, data: { token: pending[0].token } };
      const parts = photoParts(data.photo ?? "");
      const id = testId();
      const value = token();
      await sql.query(
        "insert into practical_tests (id, listing_id, skill_name, token) values ($1, $2, $3, $4)",
        [id, listing.id, listing.skill_name, value],
      );
      await sql.query("insert into test_photos (test_id, mime, body) values ($1, $2, $3)", [id, parts.mime, parts.body]);
      return { ok: true, data: { token: value } };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

export const readPracticalTest = createServerFn({ method: "POST" })
  .validator((input: { token?: string }) => input ?? {})
  .handler(async ({ data }) => {
    try {
      const value = (data.token ?? "").trim().toLowerCase();
      if (!TOKEN_RE.test(value)) return { ok: false as const, error: "This review link is not valid." };
      const sql = await getSql();
      const rows = await sql.query<{ id: string; status: string; skill_name: string; display_name: string }>(
        `select t.id, t.status, t.skill_name, l.display_name
         from practical_tests t join listings l on l.id = t.listing_id
         where t.token = $1 limit 1`,
        [value],
      );
      const row = rows[0];
      if (!row || !TEST_ID_RE.test(row.id)) return { ok: false as const, error: "This review link is not valid." };
      return {
        ok: true as const,
        data: { id: row.id, status: row.status, skill: row.skill_name, name: row.display_name, photo: `/photos/test/${row.id}` },
      };
    } catch (error) {
      return { ok: false as const, error: messageOf(error) };
    }
  });

export const reviewPracticalTest = createServerFn({ method: "POST" })
  .validator((input: { token?: string; pass?: boolean }) => input ?? {})
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const value = (data.token ?? "").trim().toLowerCase();
      if (!TOKEN_RE.test(value)) return { ok: false, error: "This review link is not valid." };
      if (typeof data.pass !== "boolean") return { ok: false, error: "Mark the task as passed or not yet." };
      const sql = await getSql();
      const status = data.pass ? "passed" : "failed";
      const updated = await sql.query<{ id: string }>(
        "update practical_tests set status = $2, reviewed_at = now() where token = $1 and status = 'pending' returning id",
        [value, status],
      );
      if (!updated[0]) return { ok: false, error: "This test has already been reviewed." };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });
