import { getSql } from "@/lib/db";
import { isWorkspacePreview } from "@/lib/env.server";

export const ROLES = ["user", "reviewer", "admin", "owner"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { user: 0, reviewer: 1, admin: 2, owner: 3 };

function staffEmails(): string[] {
  return (process.env.STAFF_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asRole(value: string | undefined): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null;
}

/** Preview is the owner so this sandbox can still be run. A published app uses STAFF_EMAILS or a stored role. */
export async function roleOf(userId: string): Promise<Role> {
  if (isWorkspacePreview()) return "owner";
  const sql = await getSql();
  const allowed = staffEmails();
  const users = await sql.query<{ email: string }>(`select email from "user" where id = $1 limit 1`, [userId]);
  const email = (users[0]?.email ?? "").toLowerCase();
  if (email && allowed[0] === email) return "owner";
  if (email && allowed.includes(email)) return "admin";
  const flags = await sql.query<{ role: string; staff: boolean }>("select role, staff from account_admin where user_id = $1", [userId]);
  const stored = asRole(flags[0]?.role);
  if (stored && stored !== "user") return stored;
  if (flags[0]?.staff) return "admin";
  return "user";
}

export async function assertRole(userId: string, minimum: Role): Promise<Role> {
  const role = await roleOf(userId);
  if (RANK[role] < RANK[minimum]) throw new Error("You do not have access to that.");
  return role;
}

/** Reviewer, admin, or owner. Reviewers do not use the admin code. */
export async function assertStaffRole(userId: string): Promise<void> {
  await assertRole(userId, "reviewer");
}

async function assertAdminCode(userId: string): Promise<void> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie("tf_staff");
  if (!token) throw new Error("Register and enter your admin code first.");
  const sql = await getSql();
  const rows = await sql.query<{ id: string }>(
    "select id from staff_sessions where id = $1 and user_id = $2 and expires_at > now() limit 1",
    [token, userId],
  );
  if (!rows[0]) throw new Error("Register and enter your admin code first.");
}

/** Review tools. A reviewer does not need the admin code. */
export async function assertStaff(userId: string): Promise<void> {
  await assertStaffRole(userId);
}

/** Admin or owner, after that person has registered a second code. */
export async function assertAdmin(userId: string): Promise<void> {
  await assertRole(userId, "admin");
  await assertAdminCode(userId);
}

/** Owner only, after that person has registered a second code. */
export async function assertOwner(userId: string): Promise<void> {
  await assertRole(userId, "owner");
  await assertAdminCode(userId);
}
