/** Every database and auth call. Screens import these functions and never the client. */

import { LIMITS } from "./config.js";
import { getClient } from "./client.js";

function missing() {
  return { data: null, error: { message: "Connect Supabase first." } };
}

function db() {
  const client = getClient();
  if (!client) return null;
  return client;
}

export async function signUp(email, password) {
  const client = db();
  if (!client) return missing();
  return client.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  const client = db();
  if (!client) return missing();
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const client = db();
  if (!client) return missing();
  return client.auth.signOut();
}

const PROFILE_COLUMNS = "user_id,display_name,skill,country,place,years,about,photo_url,msg_facebook,msg_instagram,msg_tiktok,msg_x";

export async function searchProfiles(skill, country) {
  const client = db();
  if (!client) return missing();
  let query = client.from("profiles").select(PROFILE_COLUMNS).order("created_at", { ascending: false }).limit(LIMITS.searchPage);
  if (skill) query = query.ilike("skill", "%" + skill.replace(/[%_]/g, "") + "%");
  if (country) query = query.eq("country", country);
  return query;
}

export async function workForPeople(userIds) {
  const client = db();
  if (!client) return missing();
  return client.from("work_items").select("user_id,kind,title,photo_url").in("user_id", userIds);
}

export async function loadWork(userId) {
  const client = db();
  if (!client) return missing();
  return client.from("work_items").select("id,kind,title,body,photo_url").eq("user_id", userId).order("created_at", { ascending: true });
}

export async function loadOwnProfile(userId) {
  const client = db();
  if (!client) return missing();
  return client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
}

export async function loadInbox(userId) {
  const client = db();
  if (!client) return missing();
  return client.from("messages").select("id,body,created_at").eq("talent_user_id", userId).order("created_at", { ascending: false }).limit(LIMITS.inbox);
}

export async function addWorkItem(row) {
  const client = db();
  if (!client) return missing();
  return client.from("work_items").insert(row).select("id,kind,title,body,photo_url").single();
}

export async function removeWorkItem(id, userId) {
  const client = db();
  if (!client) return missing();
  return client.from("work_items").delete().eq("id", id).eq("user_id", userId);
}

export async function saveProfile(row) {
  const client = db();
  if (!client) return missing();
  return client.from("profiles").upsert(row, { onConflict: "user_id" });
}

export async function sendMessage(row) {
  const client = db();
  if (!client) return missing();
  return client.from("messages").insert(row).select("id").single();
}

export async function sendReport(row) {
  const client = db();
  if (!client) return missing();
  return client.from("reports").insert(row);
}

export async function setProfileHidden(userId, hidden) {
  const client = db();
  if (!client) return missing();
  return client.from("profiles").update({ hidden }).eq("user_id", userId);
}

export async function listFactors() {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.listFactors();
}

export async function unenrollFactor(factorId) {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.unenroll({ factorId });
}

export async function enrollAdminCode() {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Talent Finder admin" });
}

export async function challengeFactor(factorId) {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.challenge({ factorId });
}

export async function verifyFactor(factorId, challengeId, code) {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.verify({ factorId, challengeId, code });
}

export async function assuranceLevel() {
  const client = db();
  if (!client) return missing();
  return client.auth.mfa.getAuthenticatorAssuranceLevel();
}

export async function ownAdminRow(userId) {
  const client = db();
  if (!client) return missing();
  return client.from("admins").select("role").eq("user_id", userId).maybeSingle();
}

export async function recentReports() {
  const client = db();
  if (!client) return missing();
  return client.from("reports").select("id,profile_user_id,reason").order("created_at", { ascending: false }).limit(LIMITS.adminList);
}

export async function recentMessages() {
  const client = db();
  if (!client) return missing();
  return client.from("messages").select("id,talent_user_id,body").order("created_at", { ascending: false }).limit(LIMITS.adminList);
}

export async function removeMessage(id) {
  const client = db();
  if (!client) return missing();
  return client.from("messages").delete().eq("id", id);
}

export async function grantRole(targetEmail, nextRole) {
  const client = db();
  if (!client) return missing();
  return client.rpc("grant_role", { target_email: targetEmail, next_role: nextRole });
}

export async function revokeRole(targetEmail) {
  const client = db();
  if (!client) return missing();
  return client.rpc("revoke_role", { target_email: targetEmail });
}

export async function deleteOwnProfile(userId) {
  const client = db();
  if (!client) return missing();
  return client.from("profiles").delete().eq("user_id", userId);
}

export async function deleteAccount() {
  const client = db();
  if (!client) return missing();
  return client.rpc("delete_my_account");
}
