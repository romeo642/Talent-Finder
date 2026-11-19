/** Wires the existing buttons to the data layer. The markup and checks stay the same. */

import * as api from "./api.js";
import { BLOCKED_SKILL, COUNTRIES, LIMITS, MESSAGES, STORAGE } from "./config.js";
import { connectClient, getClient, hasBuiltInKeys, readKeys } from "./client.js";
import { state } from "./state.js";
import { $, ageOf, cleanHandle, compress, esc, moderateText, pad, pageLink, readDob, talentId, validHandle } from "./util.js";
import { renderAdminMessages, renderInbox, renderResults, renderWork, reportCards, say, showTalentId, writeTalentSchema } from "./ui.js";

function setMode(next) {
  if (next === "up" && localStorage.getItem(STORAGE.ineligible) === "1") next = "in";
  state.mode = next;
  $("tab-in").className = next === "in" ? "" : "secondary";
  $("tab-up").className = next === "up" ? "" : "secondary";
  $("auth-submit").textContent = next === "in" ? "Sign in" : "Create account";
  $("password").autocomplete = next === "in" ? "current-password" : "new-password";
  $("dob-fields").hidden = next !== "up";
}

function lockSignup() {
  localStorage.setItem(STORAGE.ineligible, "1");
  $("tab-up").disabled = true;
  $("ineligible").hidden = false;
  $("dob-day").value = "";
  $("dob-month").value = "";
  $("dob-year").value = "";
  $("dob-cal").value = "";
  setMode("in");
}

async function search() {
  const box = $("results");
  if (!getClient()) {
    box.innerHTML = "<p class='muted'>" + MESSAGES.connectToSearch + "</p>";
    return;
  }
  if (!$("diligence").checked) {
    box.innerHTML = "<p class='muted'>" + MESSAGES.diligenceResults + "</p>";
    return;
  }
  const skill = $("q").value.trim();
  const country = $("country-filter").value;
  const { data, error } = await api.searchProfiles(skill, country);
  if (error) {
    box.innerHTML = "<p class='note'>" + esc(error.message) + MESSAGES.tableHint + "</p>";
    return;
  }
  if (!data || !data.length) {
    box.innerHTML = "<p class='muted'>" + MESSAGES.noneListed + "</p>";
    return;
  }
  const ids = data.map((person) => person.user_id);
  const extra = await api.workForPeople(ids);
  const byUser = {};
  (extra.data || []).forEach((item) => {
    if (!byUser[item.user_id]) byUser[item.user_id] = [];
    byUser[item.user_id].push(item);
  });
  renderResults(data, byUser, $("diligence").checked);
  writeTalentSchema(data);
}

async function loadInbox() {
  const { data, error } = await api.loadInbox(state.user.id);
  renderInbox(data, error && error.message);
}

async function loadWork() {
  const { data, error } = await api.loadWork(state.user.id);
  if (error) {
    state.workItems = [];
    renderWork(state.workItems);
    say(error.message + MESSAGES.sqlHint);
    return;
  }
  state.workItems = data || [];
  const first = state.workItems.find((item) => item.photo_url);
  state.photoData = first ? first.photo_url : "";
  renderWork(state.workItems);
}

async function loadMine() {
  const { data } = await api.loadOwnProfile(state.user.id);
  await loadWork();
  const country = (data && data.country) || $("country").value || COUNTRIES[0];
  showTalentId(country, state.user.id);
  loadInbox();
  if (!data) return;
  $("display-name").value = data.display_name || "";
  $("skill").value = data.skill || "";
  $("country").value = data.country || COUNTRIES[0];
  $("place").value = data.place || "";
  $("years").value = data.years || 1;
  $("about").value = data.about || "";
  $("msg-facebook").value = data.msg_facebook || "";
  $("msg-instagram").value = data.msg_instagram || "";
  $("msg-tiktok").value = data.msg_tiktok || "";
  $("msg-x").value = data.msg_x || "";
  if (!state.photoData && data.photo_url) state.photoData = data.photo_url;
}

async function loadAdmin() {
  $("admin-box").hidden = true;
  $("admin-tools").hidden = true;
  $("review-box").hidden = true;
  const gate = await api.ownAdminRow(state.user.id);
  if (!gate.data) return;
  const role = gate.data.role || "reviewer";
  if (role === "reviewer") {
    $("review-box").hidden = false;
    const reports = await api.recentReports();
    $("review-list").innerHTML = reportCards(reports.data || []);
    return;
  }
  $("admin-box").hidden = false;
  const assurance = await api.assuranceLevel();
  if (!(assurance.data && assurance.data.currentLevel === "aal2")) {
    $("admin-2fa").hidden = false;
    const listed = await api.listFactors();
    const verifiedFactor = ((listed.data && listed.data.totp) || []).find((factor) => factor.status === "verified");
    if (verifiedFactor) {
      state.adminFactorId = verifiedFactor.id;
      $("admin-enroll").hidden = true;
      $("admin-secret").textContent = MESSAGES.enterCode;
    } else {
      $("admin-enroll").hidden = false;
      $("admin-secret").textContent = MESSAGES.setupOnce;
    }
    return;
  }
  $("admin-2fa").hidden = true;
  $("admin-tools").hidden = false;
  $("admin-role-note").textContent = role === "owner" ? MESSAGES.ownerNote : MESSAGES.adminNote;
  const choices = role === "owner" ? ["reviewer", "admin", "owner"] : ["reviewer"];
  $("grant-role").innerHTML = choices.map((item) => "<option value='" + item + "'>" + item.charAt(0).toUpperCase() + item.slice(1) + "</option>").join("");
  const reports = await api.recentReports();
  $("report-list").innerHTML = reportCards(reports.data || []);
  const messages = await api.recentMessages();
  renderAdminMessages(messages.data || []);
}

function setUser(next) {
  state.user = next;
  $("sign-out").hidden = !next;
  $("auth-card").hidden = Boolean(next);
  $("profile-form").hidden = !next;
  $("admin-box").hidden = true;
  $("review-box").hidden = true;
  $("report-box").hidden = true;
  $("message-box").hidden = true;
  if (next) {
    loadMine();
    loadAdmin();
  }
}

function connect() {
  const saved = readKeys();
  $("sb-url").value = saved.url;
  $("sb-key").value = saved.key;
  $("connect").hidden = hasBuiltInKeys();
  if (!saved.url || !saved.key) {
    say(MESSAGES.addKeys);
    return;
  }
  const ok = connectClient(setUser);
  if (!ok) {
    say(MESSAGES.addKeys);
    return;
  }
  say(MESSAGES.connected);
  search();
}

function syncFromParts() {
  const dob = readDob();
  $("dob-cal").value = dob ? dob.getFullYear() + "-" + pad(dob.getMonth() + 1) + "-" + pad(dob.getDate()) : "";
}

function syncFromCal() {
  const value = $("dob-cal").value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const [year, month, day] = value.split("-");
  $("dob-year").value = String(Number(year));
  $("dob-month").value = String(Number(month));
  $("dob-day").value = String(Number(day));
}

async function hideOrShow(event) {
  const hide = event.target.closest("button.hide-profile");
  const show = event.target.closest("button.show-profile");
  const button = hide || show;
  if (!button || !getClient()) return;
  const { error } = await api.setProfileHidden(button.getAttribute("data-id"), Boolean(hide));
  if (error) return say(error.message);
  say(hide ? MESSAGES.hidden : MESSAGES.restored);
  search();
  loadAdmin();
}

export function bind() {
  $("save-keys").onclick = () => {
    const url = $("sb-url").value.trim().replace(/\/$/, "");
    const key = $("sb-key").value.trim();
    if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) return say(MESSAGES.badUrl);
    if (key.length < LIMITS.minKeyLength) return say(MESSAGES.badKey);
    localStorage.setItem(STORAGE.url, url);
    localStorage.setItem(STORAGE.key, key);
    connect();
  };
  $("tab-in").onclick = () => setMode("in");
  $("tab-up").onclick = () => setMode("up");
  $("dob-day").addEventListener("input", syncFromParts);
  $("dob-month").addEventListener("input", syncFromParts);
  $("dob-year").addEventListener("input", syncFromParts);
  $("dob-cal").addEventListener("change", syncFromCal);
  if (localStorage.getItem(STORAGE.ineligible) === "1") lockSignup();
  $("auth-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!getClient()) return say(MESSAGES.connectFirst);
    const email = $("email").value.trim();
    const password = $("password").value;
    if (state.mode === "up") {
      if (localStorage.getItem(STORAGE.ineligible) === "1") {
        lockSignup();
        return say(MESSAGES.under18Closed);
      }
      if (!$("privacy-ok").checked) return say(MESSAGES.privacyBox);
      const dob = readDob();
      if (!dob) return say(MESSAGES.badDob);
      if (ageOf(dob) < LIMITS.minAge) {
        lockSignup();
        return say(MESSAGES.under18);
      }
      $("dob-day").value = "";
      $("dob-month").value = "";
      $("dob-year").value = "";
      $("dob-cal").value = "";
      const result = await api.signUp(email, password);
      if (result.error) return say(result.error.message);
      say(result.data.session ? MESSAGES.accountCreatedLive : MESSAGES.accountCreated);
      return;
    }
    const result = await api.signIn(email, password);
    if (result.error) return say(result.error.message);
    say(MESSAGES.signedIn);
  };
  $("sign-out").onclick = async () => {
    if (getClient()) await api.signOut();
    say(MESSAGES.signedOut);
  };
  $("search-form").onsubmit = (event) => {
    event.preventDefault();
    if (!$("diligence").checked) return say(MESSAGES.diligenceSearch);
    search();
  };
  $("diligence").onchange = () => {
    sessionStorage.setItem(STORAGE.diligence, $("diligence").checked ? "1" : "");
    if ($("diligence").checked) search();
  };
  if (sessionStorage.getItem(STORAGE.diligence) === "1") $("diligence").checked = true;
  $("photo").onchange = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!getClient() || !state.user) return say(MESSAGES.signInPhoto);
    if (state.workItems.filter((item) => item.kind === "photo").length >= LIMITS.maxPhotos) return say(MESSAGES.photoCap);
    try {
      const photo = await compress(file);
      const { data, error } = await api.addWorkItem({
        user_id: state.user.id,
        kind: "photo",
        title: "Photo of my own work",
        body: "",
        photo_url: photo,
      });
      if (error) return say(error.message);
      state.workItems.push(data);
      state.photoData = photo;
      renderWork(state.workItems);
      say(MESSAGES.photoAdded);
    } catch (error) {
      say(error.message);
    }
  };
  $("add-record").onclick = async () => {
    if (!getClient() || !state.user) return say(MESSAGES.signInFirst);
    const title = $("work-title").value.trim();
    if (title.length < LIMITS.minNote) return say(MESSAGES.noteShort);
    if (state.workItems.filter((item) => item.kind === "note").length >= LIMITS.maxNotes) return say(MESSAGES.noteCap);
    const blocked = moderateText([title]);
    if (blocked) return say(blocked);
    const { data, error } = await api.addWorkItem({
      user_id: state.user.id,
      kind: "note",
      title,
      body: "",
      photo_url: null,
    });
    if (error) return say(error.message);
    state.workItems.push(data);
    $("work-title").value = "";
    renderWork(state.workItems);
    say(MESSAGES.noteAdded);
  };
  $("work-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button.remove-work");
    if (!button || !getClient() || !state.user) return;
    const id = button.getAttribute("data-id");
    const { error } = await api.removeWorkItem(id, state.user.id);
    if (error) return say(error.message);
    state.workItems = state.workItems.filter((item) => item.id !== id);
    const first = state.workItems.find((item) => item.photo_url);
    state.photoData = first ? first.photo_url : "";
    renderWork(state.workItems);
    say(MESSAGES.removed);
  });
  $("profile-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!getClient() || !state.user) return say(MESSAGES.signInFirst);
    if (!state.photoData) return say(MESSAGES.needPhoto);
    if (!$("photo-ok").checked) return say(MESSAGES.photoConfirm);
    const row = {
      user_id: state.user.id,
      display_name: $("display-name").value.trim(),
      skill: $("skill").value.trim(),
      country: $("country").value,
      place: $("place").value.trim(),
      years: Number($("years").value) || 0,
      about: $("about").value.trim(),
      photo_url: state.photoData,
      social: "",
      msg_facebook: cleanHandle($("msg-facebook").value),
      msg_instagram: cleanHandle($("msg-instagram").value),
      msg_tiktok: cleanHandle($("msg-tiktok").value),
      msg_x: cleanHandle($("msg-x").value),
    };
    if (BLOCKED_SKILL.test(row.skill)) return say(MESSAGES.blockedSkill);
    const handles = [row.msg_facebook, row.msg_instagram, row.msg_tiktok, row.msg_x];
    if (handles.some((handle) => !validHandle(handle))) return say(MESSAGES.badHandle);
    const blocked = moderateText([row.display_name, row.skill, row.place, row.about, handles.join(" ")]);
    if (blocked) return say(blocked);
    if (!COUNTRIES.includes(row.country)) return say(MESSAGES.badCountry);
    const { error } = await api.saveProfile(row);
    if (error) return say(error.message);
    say("Talent post saved. Your Talent ID is " + talentId(row.country, state.user.id) + ".");
    showTalentId(row.country, state.user.id);
    search();
  };
  $("results").addEventListener("click", (event) => {
    const copyTalent = event.target.closest("button.copy-talent");
    if (copyTalent) {
      const text = copyTalent.getAttribute("data-text") || pageLink();
      navigator.clipboard.writeText(text).then(() => say(MESSAGES.cardCopied)).catch(() => say(text));
      return;
    }
    const report = event.target.closest("button.report");
    const message = event.target.closest("button.message");
    if (report) {
      if (!state.user) return say(MESSAGES.signInReport);
      state.reportUserId = report.getAttribute("data-id") || "";
      $("report-who").textContent = report.getAttribute("data-name") || "";
      $("report-box").hidden = false;
      return;
    }
    if (!message) return;
    if (!state.user) return say(MESSAGES.signInMessage);
    if (!$("diligence").checked) return say(MESSAGES.diligenceMessage);
    state.messageTalentId = message.getAttribute("data-id") || "";
    if (state.messageTalentId === state.user.id) return say(MESSAGES.noSelfMessage);
    $("message-who").textContent = message.getAttribute("data-name") || "";
    $("message-box").hidden = false;
  });
  $("send-message").onclick = async () => {
    if (!getClient() || !state.user || !state.messageTalentId) return say(MESSAGES.signInMessage);
    const body = $("message-body").value.trim();
    if (body.length < 2) return say(MESSAGES.shortNote);
    const blocked = moderateText([body]);
    if (blocked) return say(blocked);
    const { data, error } = await api.sendMessage({
      talent_user_id: state.messageTalentId,
      sender_id: state.user.id,
      body,
    });
    if (error) return say(error.message);
    $("message-body").value = "";
    $("message-box").hidden = true;
    say("Message sent. Message ID " + String(data.id).slice(0, 8) + ".");
  };
  $("send-report").onclick = async () => {
    if (!getClient() || !state.user || !state.reportUserId) return say(MESSAGES.signInReport);
    if (state.reportUserId === state.user.id) return say(MESSAGES.noSelfReport);
    const { error } = await api.sendReport({
      profile_user_id: state.reportUserId,
      reporter_id: state.user.id,
      reason: $("report-reason").value,
    });
    if (error) return say(error.message);
    $("report-box").hidden = true;
    say(MESSAGES.reportSent);
  };
  $("report-list").addEventListener("click", hideOrShow);
  $("review-list").addEventListener("click", hideOrShow);
  $("admin-messages").addEventListener("click", async (event) => {
    const button = event.target.closest("button.remove-message");
    if (!button || !getClient()) return;
    const { error } = await api.removeMessage(button.getAttribute("data-id"));
    if (error) return say(error.message);
    say(MESSAGES.messageRemoved);
    loadAdmin();
  });
  $("admin-enroll").onclick = async () => {
    if (!getClient()) return;
    const listed = await api.listFactors();
    for (const factor of (listed.data && listed.data.totp) || []) {
      if (factor.status !== "verified") await api.unenrollFactor(factor.id);
    }
    const { data, error } = await api.enrollAdminCode();
    if (error) return say(error.message + MESSAGES.mfaOff);
    state.adminFactorId = data.id;
    $("admin-qr").hidden = false;
    $("admin-qr").src = data.totp.qr_code;
    $("admin-secret").textContent = MESSAGES.secretPrefix + data.totp.secret;
  };
  $("admin-verify").onclick = async () => {
    if (!getClient() || !state.adminFactorId) return say(MESSAGES.setupCodeFirst);
    const code = $("admin-code").value.trim();
    if (!/^\d{6}$/.test(code)) return say(MESSAGES.sixDigits);
    const challenge = await api.challengeFactor(state.adminFactorId);
    if (challenge.error) return say(challenge.error.message);
    const verified = await api.verifyFactor(state.adminFactorId, challenge.data.id, code);
    if (verified.error) return say(verified.error.message);
    $("admin-code").value = "";
    say(MESSAGES.codeConfirmed);
    loadAdmin();
  };
  $("admin-grant").onclick = async () => {
    if (!getClient()) return;
    const email = $("admin-email").value.trim();
    const nextRole = $("grant-role").value;
    if (!email) return say(MESSAGES.needEmail);
    const { error } = await api.grantRole(email, nextRole);
    if (error) return say(error.message);
    $("admin-email").value = "";
    say(nextRole === "reviewer" ? MESSAGES.reviewerGranted : MESSAGES.roleGranted);
  };
  $("admin-revoke").onclick = async () => {
    if (!getClient()) return;
    const email = $("revoke-email").value.trim();
    if (!email) return say(MESSAGES.needRevokeEmail);
    const { error } = await api.revokeRole(email);
    if (error) return say(error.message);
    $("revoke-email").value = "";
    say(MESSAGES.roleRemoved);
  };
  $("delete-profile").onclick = async () => {
    if (!getClient() || !state.user) return say(MESSAGES.signInFirst);
    if (!window.confirm(MESSAGES.deleteConfirm)) return;
    await api.deleteOwnProfile(state.user.id);
    const { error } = await api.deleteAccount();
    state.photoData = "";
    try { await api.signOut(); } catch (ignore) { /* the login may already be gone */ }
    say(error ? MESSAGES.deletedPartial : MESSAGES.deleted);
  };
  $("share-copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(pageLink());
      say(MESSAGES.linkCopied);
    } catch (ignore) {
      say(pageLink());
    }
  };
  $("share-id").onclick = async () => {
    if (!state.user) return say(MESSAGES.signInShare);
    const id = talentId($("country").value, state.user.id);
    const name = $("display-name").value.trim() || "A skilled hand";
    const skill = $("skill").value.trim() || "skilled work";
    const place = $("place").value.trim();
    const url = location.origin + location.pathname + "?skill=" + encodeURIComponent(skill);
    const text = name + " does " + skill + (place ? " in " + place : "") + ". Talent ID " + id + ". Check the work yourself. " + url;
    try {
      await navigator.clipboard.writeText(text);
      say(MESSAGES.idCopied);
    } catch (ignore) {
      say(text);
    }
  };
  const presetSkill = new URLSearchParams(location.search).get("skill");
  if (presetSkill) $("q").value = presetSkill;
  connect();
}
