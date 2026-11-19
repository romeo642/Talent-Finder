import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import { CONSENT_VERSION } from "@/lib/privacy";
import { assertAdmin, assertStaff } from "@/lib/staff";
import { requireAge } from "@/lib/hire-api";

export type ConsentInput = {
  publicOk?: boolean;
  ownWork?: boolean;
  adultOk?: boolean;
  boards?: boolean;
  tips?: boolean;
  language?: string;
  country?: string;
};

function id(): string {
  return randomId();
}

function consentOk(input: ConsentInput | null | undefined): boolean {
  return Boolean(input?.publicOk && input?.ownWork && input?.adultOk);
}

export async function applyLatestConsent(userId: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql.query<{ boards: boolean; tips: boolean; version: number }>(
    `select boards, tips, version from consents
     where user_id = $1 and version = $2 and public_ok = true and own_work = true
     order by created_at desc limit 1`,
    [userId, CONSENT_VERSION],
  );
  const consent = rows[0];
  if (!consent) {
    await sql.query(
      `update listings set visibility = 'draft'
       where user_id = $1 and is_sample = false and visibility = 'public' and consent_version <> $2`,
      [userId, CONSENT_VERSION],
    );
    return;
  }
  await sql.query(
    `update listings set visibility = 'public', consent_version = $2, on_boards = $3, tips = $4, hidden_reason = ''
     where user_id = $1 and is_sample = false and visibility <> 'hidden'`,
    [userId, consent.version, consent.boards, consent.tips],
  );
}

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ConsentInput) => input ?? {})
  .handler(async ({ data, context }) => {
    if (!consentOk(data)) return { ok: false as const, error: "Tick the required boxes, including that you are 18 or older." };
    try {
      await requireAge(context.userId);
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Confirm that you are 18 or older." };
    }
    const language = data.language === "fr" ? "fr" : "en";
    const country = (data.country ?? "").trim().toUpperCase().slice(0, 2) || "GH";
    const sql = await getSql();
    await sql.query(
      `insert into consents (id, user_id, country, version, public_ok, own_work, boards, tips, language)
       values ($1, $2, $3, $4, true, true, $5, $6, $7)`,
      [id(), context.userId, country, CONSENT_VERSION, Boolean(data.boards), Boolean(data.tips), language],
    );
    await applyLatestConsent(context.userId);
    return { ok: true as const };
  });

export const hideProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query(
      `update listings set visibility = 'hidden', hidden_reason = 'hidden by owner'
       where user_id = $1 and is_sample = false`,
      [context.userId],
    );
    return { ok: true as const };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      "select id from listings where user_id = $1 and is_sample = false limit 1",
      [context.userId],
    );
    const listingId = rows[0]?.id;
    if (listingId) {
      await sql.query("delete from listing_photos where listing_id = $1", [listingId]);
      await sql.query(
        `update listings set visibility = 'hidden', hidden_reason = 'deleted',
           display_name = 'Deleted', phone = '', whatsapp = '', email = '',
           facebook = '', instagram = '', twitter = '', tiktok = '', reach = '',
           experience = '', photo = '', contact_active = false
         where id = $1`,
        [listingId],
      );
    }
    await sql.query(
      "insert into deletion_requests (id, user_id, status) values ($1, $2, 'done')",
      [id(), context.userId],
    );
    return {
      ok: true as const,
      data: { message: "Your profile is off the public pages. Photos and contact details are removed. Payment records stay where the law requires them." },
    };
  });

export const downloadMyData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const listings = await sql.query<{
      id: string;
      country_name: string;
      skill_name: string;
      display_name: string;
      visibility: string;
    }>(
      `select id, country_name, region_name, town_name, community_name, skill_name, years, display_name,
              phone, email, facebook, instagram, twitter, tiktok, experience, visibility, language
       from listings where user_id = $1 and is_sample = false`,
      [context.userId],
    );
    const consents = await sql.query<{ country: string; version: number; language: string; created_at: string }>(
      "select country, version, public_ok, own_work, boards, tips, language, created_at::text as created_at from consents where user_id = $1 order by created_at desc",
      [context.userId],
    );
    return { ok: true as const, data: { listings, consents } };
  });

export const reportProfile = createServerFn({ method: "POST" })
  .validator((input: { id?: string; reason?: string; note?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const listingId = (data.id ?? "").trim().toUpperCase();
    const reason = (data.reason ?? "").trim().slice(0, 40);
    const allowed = new Set(["not their work", "fake", "unsafe", "abusive", "other"]);
    if (!listingId || !allowed.has(reason)) return { ok: false as const, error: "Choose a reason." };
    const sql = await getSql();
    await sql.query("insert into profile_reports (id, listing_id, reason, note) values ($1, $2, $3, $4)", [
      id(),
      listingId,
      reason,
      (data.note ?? "").replace(/\s+/g, " ").trim().slice(0, 280),
    ]);
    const count = await sql.query<{ n: number }>(
      "select count(*)::int as n from profile_reports where listing_id = $1",
      [listingId],
    );
    if (Number(count[0]?.n ?? 0) >= 3) {
      await sql.query(
        `update listings set visibility = 'hidden', hidden_reason = 'hidden pending review'
         where id = $1 and is_sample = false`,
        [listingId],
      );
    }
    return { ok: true as const };
  });

async function logView(subject: string) {
  const sql = await getSql();
  await sql.query("insert into admin_views (id, staff, subject) values ($1, 'admin', $2)", [id(), subject]);
}

export const adminTrustReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  await assertStaff(context.userId);
  const sql = await getSql();
  await logView("consent and reports");
  const consents = await sql.query<{ user_id: string; country: string; version: number; language: string }>(
    "select user_id, country, version, boards, tips, language, created_at::text as created_at from consents order by created_at desc limit 30",
  );
  const deletions = await sql.query<{ user_id: string; status: string }>(
    "select user_id, status, created_at::text as created_at from deletion_requests order by created_at desc limit 30",
  );
  const reports = await sql.query<{ listing_id: string; reason: string; note: string }>(
    "select listing_id, reason, note, created_at::text as created_at from profile_reports order by created_at desc limit 30",
  );
  const breaches = await sql.query<{ id: string; country: string; what: string; people: number; status: string }>(
    "select id, country, what, people, status, created_at::text as created_at from breach_log order by created_at desc limit 30",
  );
  return { ok: true as const, data: { consents, deletions, reports, breaches } };
});

export const appealHidden = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { note?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const note = (data.note ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
    if (note.length < 8) return { ok: false as const, error: "Say what you want reviewed." };
    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      "select id from listings where user_id = $1 and is_sample = false limit 1",
      [context.userId],
    );
    if (!rows[0]) return { ok: false as const, error: "No profile to review." };
    await sql.query("insert into appeals (id, listing_id, user_id, note) values ($1, $2, $3, $4)", [
      id(),
      rows[0].id,
      context.userId,
      note,
    ]);
    return { ok: true as const, data: { message: "Appeal sent. The team answers within 7 days." } };
  });

export const clearContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { field?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const field = data.field ?? "";
    const allowed: Record<string, string> = {
      phone: "phone",
      email: "email",
      facebook: "facebook",
      instagram: "instagram",
      twitter: "twitter",
      tiktok: "tiktok",
      reach: "reach",
    };
    const column = allowed[field];
    if (!column) return { ok: false as const, error: "Choose a contact to remove." };
    const sql = await getSql();
    await sql.query(`update listings set ${column} = '' where user_id = $1 and is_sample = false`, [context.userId]);
    return { ok: true as const, data: { message: "Removed. It is off your public profile now." } };
  });

export const reviewQueue = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  await assertStaff(context.userId);
  const sql = await getSql();
  await logView("review queue");
  const rows = await sql.query<{
    id: string;
    display_name: string;
    skill_name: string;
    review_status: string;
    photo: string;
    flags: number;
  }>(
    `select listings.id, listings.display_name, listings.skill_name, listings.review_status, listings.photo,
            count(review_flags.id)::int as flags
     from listings
     left join review_flags on review_flags.listing_id = listings.id
     where listings.is_sample = false and listings.review_status <> 'clear'
     group by listings.id
     order by flags desc
     limit 30`,
  );
  return { ok: true as const, data: rows };
});

export const decideReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; outcome?: string; reason?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const outcome = data.outcome ?? "";
    if (!["approved", "proof", "rejected"].includes(outcome)) return { ok: false as const, error: "Choose an outcome." };
    const reason = (data.reason ?? "").replace(/\s+/g, " ").trim().slice(0, 240) || "Reviewed";
    const listingId = (data.id ?? "").trim();
    const sql = await getSql();
    if (outcome === "rejected") {
      await sql.query(
        "update listings set review_status = 'rejected', visibility = 'hidden', hidden_reason = $2, work_checked = false where id = $1",
        [listingId, reason],
      );
    } else if (outcome === "proof") {
      await sql.query("update listings set review_status = 'proof', hidden_reason = $2 where id = $1", [listingId, reason]);
    } else {
      await sql.query("update listings set review_status = 'approved', hidden_reason = '' where id = $1", [listingId]);
      const dated = await sql.query<{ n: number }>("select count(*)::int as n from photo_notes where listing_id = $1 and made_on <> ''", [listingId]);
      const flags = await sql.query<{ n: number }>("select count(*)::int as n from review_flags where listing_id = $1 and kind = 'duplicate'", [listingId]);
      if (Number(dated[0]?.n ?? 0) >= 3 && Number(flags[0]?.n ?? 0) === 0) {
        await sql.query("update listings set work_checked = true where id = $1", [listingId]);
      }
    }
    await sql.query("insert into review_decisions (id, listing_id, reviewer, outcome, reason) values ($1, $2, 'admin', $3, $4)", [
      id(),
      listingId,
      outcome,
      reason,
    ]);
    await logView(`review ${outcome}`);
    return { ok: true as const };
  });

export const affectedUsers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { country?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const country = (data.country ?? "").trim().toUpperCase().slice(0, 2);
    const sql = await getSql();
    await logView(`affected ${country}`);
    const rows = await sql.query<{ id: string; display_name: string }>(
      "select id, display_name from listings where country_code = $1 and is_sample = false limit 50",
      [country],
    );
    return { ok: true as const, data: rows };
  });

export const logBreach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { country?: string; what?: string; people?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const what = (data.what ?? "").trim().slice(0, 400);
    if (what.length < 8) return { ok: false as const, error: "Describe the breach." };
    const sql = await getSql();
    await sql.query("insert into breach_log (id, country, what, people) values ($1, $2, $3, $4)", [
      id(),
      (data.country ?? "").trim().toUpperCase().slice(0, 2) || "GH",
      what,
      Math.max(0, Math.floor(Number(data.people) || 0)),
    ]);
    await logView("breach log");
    return { ok: true as const };
  });
