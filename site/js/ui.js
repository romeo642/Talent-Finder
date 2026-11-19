/** Draws the page. It does not call Supabase. */

import { COUNTRIES, LIMITS, MESSAGES, PITCH, SKILLS } from "./config.js";
import { $, esc, pageLink, talentId } from "./util.js";

export function say(message) {
  const node = $("status");
  node.hidden = !message;
  node.textContent = message || "";
}

export function fillLists() {
  SKILLS.forEach((skill) => {
    const option = document.createElement("option");
    option.value = skill;
    $("skills").appendChild(option);
  });
  for (const select of [$("country"), $("country-filter")]) {
    COUNTRIES.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }
}

export async function loadSchemaText() {
  try {
    const response = await fetch("schema.sql");
    if (!response.ok) throw new Error("missing");
    $("sql").textContent = await response.text();
  } catch (ignore) {
    $("sql").textContent = MESSAGES.sqlMissing;
  }
}

export function wireShareLinks() {
  const link = pageLink();
  $("share-wa").href = "https://wa.me/?text=" + encodeURIComponent(PITCH + link);
  $("share-fb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link);
  $("share-x").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(PITCH) + "&url=" + encodeURIComponent(link);
  $("share-li").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(link);
}

function messagingLinks(person, open) {
  if (!open) return "<p class='muted' style='margin-top:8px'>Messaging IDs stay hidden until you confirm you will check this person yourself.</p>";
  const rows = [
    ["Facebook", person.msg_facebook, "https://www.facebook.com/"],
    ["Instagram", person.msg_instagram, "https://www.instagram.com/"],
    ["TikTok", person.msg_tiktok, "https://www.tiktok.com/@"],
    ["X", person.msg_x, "https://x.com/"],
  ].filter((row) => row[1]);
  if (!rows.length) return "<p class='muted' style='margin-top:8px'>No messaging ID on this post.</p>";
  return "<p style='margin-top:8px'>" + rows.map((row) => "<a href='" + esc(row[2] + row[1]) + "'>" + esc(row[0]) + ": " + esc(row[1]) + "</a>").join("<br>") + "</p>";
}

function cardShare(person) {
  const id = talentId(person.country, person.user_id);
  const url = location.origin + location.pathname + "?skill=" + encodeURIComponent(person.skill);
  const text = person.display_name + " does " + person.skill + " in " + person.place + ". Talent ID " + id + ". Check the work yourself. " + url;
  return "<div class='actions'>"
    + "<a href='https://wa.me/?text=" + encodeURIComponent(text) + "'>Share on WhatsApp</a>"
    + "<a href='https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "'>Share on Facebook</a>"
    + "<a href='https://twitter.com/intent/tweet?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(person.display_name + " · " + person.skill + " · Talent ID " + id) + "'>Share on X</a>"
    + "<a href='https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url) + "'>Share on LinkedIn</a>"
    + "<button type='button' class='secondary copy-talent' data-text='" + esc(text) + "'>Copy link</button>"
    + "</div>";
}

export function renderResults(people, byUser, diligence) {
  const box = $("results");
  box.innerHTML = people.map((person) => {
    const photos = (byUser[person.user_id] || []).filter((item) => item.photo_url).slice(0, LIMITS.sharePhotos);
    const notes = (byUser[person.user_id] || []).filter((item) => item.kind === "note").slice(0, LIMITS.shareNotes);
    const images = photos.length
      ? photos.map((item) => "<img alt='Photo of finished " + esc(person.skill) + " work in " + esc(person.place) + "' src='" + esc(item.photo_url) + "' loading='lazy' />").join("")
      : "<img alt='Photo of finished " + esc(person.skill) + " work in " + esc(person.place) + "' src='" + esc(person.photo_url || "") + "' loading='lazy' />";
    const records = notes.map((item) => "<p class='muted'>" + esc(item.title) + "</p>").join("");
    const contact = messagingLinks(person, diligence);
    const messageButton = diligence ? "<button type='button' class='secondary message' data-id='" + esc(person.user_id) + "' data-name='" + esc(person.display_name) + "'>Message this Talent ID</button>" : "";
    return "<article class='person'>" + images + "<div><p class='skill'>" + esc(person.skill) + "</p><h3 style='margin:4px 0'>" + esc(person.display_name) + "</h3><p class='muted'>Talent ID " + esc(talentId(person.country, person.user_id)) + " · " + esc(person.years) + " years · " + esc(person.place) + ", " + esc(person.country) + "</p><p style='margin-top:8px'>" + esc(person.about) + "</p>" + records + contact + "<p class='muted' style='margin-top:8px'>Do your own due diligence before you hire.</p>" + cardShare(person) + "<div class='actions'><button type='button' class='secondary report' data-id='" + esc(person.user_id) + "' data-name='" + esc(person.display_name) + "'>Report this profile</button>" + messageButton + "</div></div></article>";
  }).join("");
}

export function writeTalentSchema(people) {
  const previous = document.getElementById("talent-schema");
  if (previous) previous.remove();
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: people.map((person, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: person.skill + " in " + person.place,
        areaServed: person.place + ", " + person.country,
        provider: { "@type": "Person", name: person.display_name },
      },
    })),
  };
  const script = document.createElement("script");
  script.id = "talent-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function renderWork(workItems) {
  const box = $("work-list");
  if (!workItems.length) {
    box.innerHTML = "<p class='muted'>No photos or job records yet. Add a photo of your own work.</p>";
    return;
  }
  box.innerHTML = workItems.map((item) => {
    const image = item.photo_url ? "<img alt='Photo of your own finished work' src='" + esc(item.photo_url) + "' loading='lazy' style='width:100%;max-height:180px;object-fit:cover;border-radius:12px' />" : "";
    return "<article class='note'>" + image + "<p>" + esc(item.title || "Photo of my work") + "</p><button type='button' class='secondary remove-work' data-id='" + esc(item.id) + "'>Remove</button></article>";
  }).join("");
}

export function renderInbox(rows, error) {
  const box = $("inbox");
  if (error) {
    box.innerHTML = "<p class='muted'>" + esc(error) + "</p>";
    return;
  }
  box.innerHTML = rows && rows.length
    ? rows.map((row) => "<article class='note'><p class='muted'>Message ID " + esc(String(row.id).slice(0, 8)) + "</p><p>" + esc(row.body) + "</p></article>").join("")
    : "<p class='muted'>No messages yet.</p>";
}

export function reportCards(rows) {
  return rows.length
    ? rows.map((row) => "<div class='note'><p>" + esc(row.reason) + "</p><div class='actions'><button type='button' class='secondary hide-profile' data-id='" + esc(row.profile_user_id) + "'>Hide</button><button type='button' class='secondary show-profile' data-id='" + esc(row.profile_user_id) + "'>Restore</button></div></div>").join("")
    : "<p class='muted'>No reports yet.</p>";
}

export function renderAdminMessages(rows) {
  $("admin-messages").innerHTML = rows.length
    ? rows.map((row) => "<div class='note'><p class='muted'>Message ID " + esc(String(row.id).slice(0, 8)) + " · Talent " + esc(String(row.talent_user_id).slice(0, 8)) + "</p><p>" + esc(row.body) + "</p><button type='button' class='secondary remove-message' data-id='" + esc(row.id) + "'>Remove message</button></div>").join("")
    : "<p class='muted'>No messages yet.</p>";
}

export function showTalentId(country, userId) {
  $("talent-id").hidden = false;
  $("talent-id").textContent = "Your Talent ID is " + talentId(country, userId) + ". It stays with this account. You can edit the post, add or remove photos and records, or delete the account.";
}
