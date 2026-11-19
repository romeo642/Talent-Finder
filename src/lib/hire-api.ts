import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { cleanName } from "@/lib/directory";
import { randomId } from "@/lib/ids";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

export const confirmAge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query(
      `insert into age_checks (user_id) values ($1) on conflict (user_id) do nothing`,
      [context.userId],
    );
    return { ok: true as const };
  });

export async function requireAge(userId: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>("select user_id from age_checks where user_id = $1", [userId]);
  if (!rows[0]) throw new Error("Confirm that you are 18 or older before anything is saved.");
}

export const sendHireRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; note?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    try {
      const id = (data.id ?? "").trim().toUpperCase();
      const note = (data.note ?? "").replace(/\s+/g, " ").trim();
      if (note.length < 8 || note.length > 180) return { ok: false as const, error: "Write a short note: the job, the place, and when." };
      const sql = await getSql();
      const listing = await sql.query<{ user_id: string; visibility: string }>(
        "select user_id, visibility from listings where id = $1 and is_sample = false limit 1",
        [id],
      );
      const row = listing[0];
      if (!row || row.visibility !== "public") return { ok: false as const, error: "That profile is not public." };
      if (row.user_id === context.userId) return { ok: false as const, error: "You cannot request your own profile." };
      const recent = await sql.query<{ n: number }>(
        `select count(*)::int as n from hire_requests where seeker_user_id = $1 and created_at > now() - interval '1 day'`,
        [context.userId],
      );
      if (Number(recent[0]?.n ?? 0) >= 8) return { ok: false as const, error: "You have sent enough requests for today." };
      const open = await sql.query<{ id: string }>(
        `select id from hire_requests where listing_id = $1 and seeker_user_id = $2 and status = 'pending' limit 1`,
        [id, context.userId],
      );
      if (open[0]) return { ok: false as const, error: "You already have a request waiting." };
      await sql.query(
        `insert into hire_requests (id, listing_id, talent_user_id, seeker_user_id, note) values ($1, $2, $3, $4, $5)`,
        [randomId(), id, row.user_id, context.userId, note],
      );
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, error: messageOf(error) };
    }
  });

export const myHireRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      note: string;
      status: string;
      seeker_name: string;
    }>(
      `select hire_requests.id, hire_requests.note, hire_requests.status, coalesce("user".name, 'Seeker') as seeker_name
       from hire_requests
       left join "user" on "user".id = hire_requests.seeker_user_id
       where hire_requests.talent_user_id = $1
       order by hire_requests.created_at desc
       limit 20`,
      [context.userId],
    );
    return { ok: true as const, data: rows };
  });

export const decideHire = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; accept?: boolean; revealPhone?: boolean }) => input ?? {})
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const accept = data.accept === true;
    const updated = await sql.query<{ id: string }>(
      `update hire_requests set status = $3, reveal_phone = $4
       where id = $1 and talent_user_id = $2 and status = 'pending'
       returning id`,
      [data.id ?? "", context.userId, accept ? "accepted" : "declined", accept && data.revealPhone === true],
    );
    if (!updated[0]) return { ok: false as const, error: "That request is no longer waiting." };
    return { ok: true as const };
  });

export const acceptedContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const id = (data.id ?? "").trim().toUpperCase();
    const sql = await getSql();
    const rows = await sql.query<{ email: string | null; phone: string | null; reveal_phone: boolean; display_name: string; request_id: string }>(
      `select listings.email, listings.phone, hire_requests.reveal_phone, listings.display_name, hire_requests.id as request_id
       from hire_requests
       join listings on listings.id = hire_requests.listing_id
       where hire_requests.listing_id = $1 and hire_requests.seeker_user_id = $2 and hire_requests.status = 'accepted'
       limit 1`,
      [id, context.userId],
    );
    const row = rows[0];
    if (!row) return { ok: true as const, data: null };
    return {
      ok: true as const,
      data: {
        requestId: row.request_id,
        name: cleanName(row.display_name) ?? row.display_name,
        email: row.email || null,
        phone: row.reveal_phone ? row.phone || null : null,
      },
    };
  });

export const mySentRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{ id: string; listing_id: string; note: string; status: string; skill_name: string }>(
      `select hire_requests.id, hire_requests.listing_id, hire_requests.note, hire_requests.status, listings.skill_name
       from hire_requests
       join listings on listings.id = hire_requests.listing_id
       where hire_requests.seeker_user_id = $1
       order by hire_requests.created_at desc
       limit 20`,
      [context.userId],
    );
    return { ok: true as const, data: rows };
  });

async function participant(requestId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ id: string; status: string }>(
    `select id, status from hire_requests
     where id = $1 and status = 'accepted' and (talent_user_id = $2 or seeker_user_id = $2)
     limit 1`,
    [requestId, userId],
  );
  return rows[0] ?? null;
}

export const listMessages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { requestId?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const requestId = (data.requestId ?? "").trim();
    if (!(await participant(requestId, context.userId))) return { ok: false as const, error: "This chat opens after a request is accepted." };
    const sql = await getSql();
    const rows = await sql.query<{ id: string; sender_id: string; body: string }>(
      `select id, sender_id, body from messages where request_id = $1 order by created_at asc limit 80`,
      [requestId],
    );
    return { ok: true as const, data: rows.map((row) => ({ id: row.id, mine: row.sender_id === context.userId, body: row.body })) };
  });

export const postMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { requestId?: string; body?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const requestId = (data.requestId ?? "").trim();
    const body = (data.body ?? "").replace(/\s+/g, " ").trim();
    if (body.length < 1 || body.length > 500) return { ok: false as const, error: "Write a short message." };
    if (!(await participant(requestId, context.userId))) return { ok: false as const, error: "This chat opens after a request is accepted." };
    const sql = await getSql();
    await sql.query("insert into messages (id, request_id, sender_id, body) values ($1, $2, $3, $4)", [
      randomId(),
      requestId,
      context.userId,
      body,
    ]);
    return { ok: true as const };
  });

