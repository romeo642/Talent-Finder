import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import { hasProfanity } from "@/lib/profanity";
import { assertStaff } from "@/lib/staff";

const LISTING_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/;

export type WorkReview = {
  id: string;
  authorName: string;
  stars: number;
  body: string;
  visible: boolean;
};

function cleanBody(value: string): string {
  const body = value.replace(/\s+/g, " ").trim();
  if (body.length < 10 || body.length > 400) throw new Error("Write 10 to 400 characters about the work.");
  if (hasProfanity(body)) throw new Error("That review is not allowed.");
  return body;
}

export const listWorkReviews = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const id = (data.id ?? "").trim().toUpperCase();
    if (!LISTING_RE.test(id)) return { ok: true as const, data: [] as WorkReview[] };
    const sql = await getSql();
    const rows = await sql.query<{ id: string; author_name: string; stars: number; body: string }>(
      `select id, author_name, stars, body from work_reviews
       where listing_id = $1 and visible = true
       order by created_at desc limit 20`,
      [id],
    );
    return {
      ok: true as const,
      data: rows.map((row) => ({
        id: row.id,
        authorName: row.author_name,
        stars: Number(row.stars),
        body: row.body,
        visible: true,
      })),
    };
  });

export const submitWorkReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; stars?: number; body?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const id = (data.id ?? "").trim().toUpperCase();
    const stars = Math.floor(Number(data.stars) || 0);
    if (!LISTING_RE.test(id)) return { ok: false as const, error: "That ID is not valid." };
    if (stars < 1 || stars > 5) return { ok: false as const, error: "Choose 1 to 5 stars." };
    let body = "";
    try {
      body = cleanBody(data.body ?? "");
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Write a review of the work." };
    }
    const sql = await getSql();
    const listing = await sql.query<{ user_id: string }>("select user_id from listings where id = $1 limit 1", [id]);
    if (!listing[0]) return { ok: false as const, error: "That profile is not published." };
    if (listing[0].user_id === context.userId) return { ok: false as const, error: "You cannot review your own profile." };
    const hired = await sql.query<{ id: string }>(
      `select id from hire_requests
       where listing_id = $1 and seeker_user_id = $2 and status = 'accepted' limit 1`,
      [id, context.userId],
    );
    if (!hired[0]) return { ok: false as const, error: "Only someone whose hire request was accepted can review the work." };
    const users = await sql.query<{ name: string }>(`select name from "user" where id = $1 limit 1`, [context.userId]);
    const author = (users[0]?.name ?? "Client").replace(/\s+/g, " ").trim().slice(0, 80) || "Client";
    const inserted = await sql.query<{ id: string }>(
      `insert into work_reviews (id, listing_id, author_id, author_name, stars, body, visible)
       select $1, $2, $3, $4, $5, $6, false
       where not exists (select 1 from work_reviews where listing_id = $2 and author_id = $3)
       returning id`,
      [randomId(), id, context.userId, author, stars, body],
    );
    if (!inserted[0]) return { ok: false as const, error: "You already reviewed this work. An admin decides if it is shown." };
    return { ok: true as const };
  });

export const adminWorkReviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      await assertStaff(context.userId);
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Staff only." };
    }
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      listing_id: string;
      author_name: string;
      stars: number;
      body: string;
      visible: boolean;
    }>(
      `select id, listing_id, author_name, stars, body, visible
       from work_reviews order by visible asc, created_at desc limit 40`,
    );
    return {
      ok: true as const,
      data: rows.map((row) => ({
        id: row.id,
        listingId: row.listing_id,
        authorName: row.author_name,
        stars: Number(row.stars),
        body: row.body,
        visible: Boolean(row.visible),
      })),
    };
  });

export const adminShowReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; visible?: boolean }) => input ?? {})
  .handler(async ({ data, context }) => {
    try {
      await assertStaff(context.userId);
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Staff only." };
    }
    const id = (data.id ?? "").trim();
    if (!id) return { ok: false as const, error: "Choose a review." };
    const sql = await getSql();
    const updated = await sql.query<{ id: string }>(
      "update work_reviews set visible = $2 where id = $1 returning id",
      [id, data.visible === true],
    );
    if (!updated[0]) return { ok: false as const, error: "That review was not found." };
    await sql.query("insert into admin_views (id, staff, subject) values ($1, 'admin', $2)", [
      randomId(),
      `${data.visible ? "show" : "hide"} review ${id}`,
    ]);
    return { ok: true as const };
  });
