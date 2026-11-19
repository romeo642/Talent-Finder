import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { randomId } from "@/lib/ids";
import { assertRole, roleOf } from "@/lib/staff";
import { randomBase32, totpMatches } from "@/lib/totp";

const COOKIE = "tf_staff";

async function emailOf(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql.query<{ email: string }>(`select email from "user" where id = $1 limit 1`, [userId]);
  return rows[0]?.email ?? "staff";
}

async function passed(userId: string): Promise<boolean> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE);
  if (!token) return false;
  const sql = await getSql();
  const rows = await sql.query<{ id: string }>(
    "select id from staff_sessions where id = $1 and user_id = $2 and expires_at > now() limit 1",
    [token, userId],
  );
  return Boolean(rows[0]);
}

async function remember(userId: string): Promise<void> {
  const sql = await getSql();
  const id = randomId(16);
  await sql.query(
    "insert into staff_sessions (id, user_id, expires_at) values ($1, $2, now() + interval '12 hours')",
    [id, userId],
  );
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export const staffGate = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await roleOf(context.userId);
    if (role === "user") return { ok: false as const, error: "Only an admin or owner can register a second code." };
    if (role === "reviewer") {
      return { ok: true as const, data: { enrolled: true, passed: true, role, twoFactor: false } };
    }
    const sql = await getSql();
    const rows = await sql.query<{ enabled: boolean }>("select enabled from staff_totp where user_id = $1", [context.userId]);
    return {
      ok: true as const,
      data: { enrolled: Boolean(rows[0]?.enabled), passed: await passed(context.userId), role, twoFactor: true },
    };
  });

async function adminOnly(userId: string): Promise<string | null> {
  try {
    await assertRole(userId, "admin");
    return null;
  } catch {
    return "Only an admin or owner can register a second code.";
  }
}

export const staffTotpBegin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const denied = await adminOnly(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const sql = await getSql();
    const existing = await sql.query<{ enabled: boolean }>("select enabled from staff_totp where user_id = $1", [context.userId]);
    if (existing[0]?.enabled) return { ok: false as const, error: "This admin already registered a code. Enter the 6 digits." };
    const secret = randomBase32();
    await sql.query(
      `insert into staff_totp (user_id, secret, enabled) values ($1, $2, false)
       on conflict (user_id) do update set secret = excluded.secret, enabled = false, updated_at = now()`,
      [context.userId, secret],
    );
    const email = encodeURIComponent(await emailOf(context.userId));
    return {
      ok: true as const,
      data: { secret, uri: `otpauth://totp/Talent%20Finder:${email}?secret=${secret}&issuer=Talent%20Finder&digits=6&period=30` },
    };
  });

export const staffTotpEnable = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { code?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOnly(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const sql = await getSql();
    const rows = await sql.query<{ secret: string }>("select secret from staff_totp where user_id = $1 and enabled = false", [context.userId]);
    if (!rows[0] || !(await totpMatches(rows[0].secret, data.code ?? ""))) {
      return { ok: false as const, error: "That code does not match. Check the time on your phone and try again." };
    }
    await sql.query("update staff_totp set enabled = true, updated_at = now() where user_id = $1", [context.userId]);
    await remember(context.userId);
    return { ok: true as const };
  });

export const staffTotpVerify = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { code?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const denied = await adminOnly(context.userId);
    if (denied) return { ok: false as const, error: denied };
    const sql = await getSql();
    const rows = await sql.query<{ secret: string }>("select secret from staff_totp where user_id = $1 and enabled = true", [context.userId]);
    if (!rows[0] || !(await totpMatches(rows[0].secret, data.code ?? ""))) {
      return { ok: false as const, error: "That code does not match." };
    }
    await remember(context.userId);
    return { ok: true as const };
  });
