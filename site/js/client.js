/** One Supabase client. A second connect replaces it so listeners do not pile up. */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { STORAGE, SUPABASE_KEY, SUPABASE_URL } from "./config.js";

let client = null;
let unsubscribe = null;

export function getClient() {
  return client;
}

export function readKeys() {
  return {
    url: SUPABASE_URL || localStorage.getItem(STORAGE.url) || "",
    key: SUPABASE_KEY || localStorage.getItem(STORAGE.key) || "",
  };
}

export function hasBuiltInKeys() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function connectClient(onUser) {
  const saved = readKeys();
  if (!saved.url || !saved.key) {
    client = null;
    return false;
  }
  if (unsubscribe) unsubscribe();
  client = createClient(saved.url, saved.key);
  client.auth.getSession().then(({ data }) => onUser(data.session?.user || null)).catch(() => onUser(null));
  const { data } = client.auth.onAuthStateChange((_event, session) => onUser(session?.user || null));
  unsubscribe = () => data.subscription.unsubscribe();
  return true;
}
