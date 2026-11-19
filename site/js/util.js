/** Checks that must run before a row is sent. The database repeats them. */

import { BLOCKED_SKILL, LIMITS, MESSAGES } from "./config.js";

export const $ = (id) => document.getElementById(id);

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

export function cleanHandle(value) {
  return String(value || "").trim().replace(/^@+/, "");
}

export function validHandle(value) {
  return value === "" || /^[A-Za-z0-9._]{2,50}$/.test(value);
}

export function talentId(country, userId) {
  const prefix = country === "Zambia" ? "ZM" : "GH";
  return prefix + "-" + String(userId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function pad(number) {
  return String(number).padStart(2, "0");
}

export function readDob() {
  const day = Number($("dob-day").value);
  const month = Number($("dob-month").value);
  const year = Number($("dob-year").value);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date > new Date()) return null;
  return date;
}

export function ageOf(date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

export function moderateText(parts) {
  const blob = parts.join(" ").toLowerCase();
  if (BLOCKED_SKILL.test(blob) || /passport|identity card|ghana card|\bnrc\b|porn|nude|\bxxx\b/.test(blob)) {
    return MESSAGES.textBlocked;
  }
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(blob)) return MESSAGES.emailBlocked;
  if (/[0-9]([ -]?[0-9]){9,}/.test(blob)) return MESSAGES.phoneBlocked;
  return "";
}

function screenPhoto(canvas) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  if (width < LIMITS.minPhotoPx || height < LIMITS.minPhotoPx) throw new Error(MESSAGES.tooSmall);
  const ratio = width / height;
  const sample = context.getImageData(0, 0, width, height).data;
  let count = 0;
  let saturation = 0;
  const step = 10;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const red = sample[index];
      const green = sample[index + 1];
      const blue = sample[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      saturation += max === 0 ? 0 : (max - min) / max;
      count += 1;
    }
  }
  const average = saturation / Math.max(1, count);
  if (ratio > 1.45 && ratio < 1.7 && average < 0.22) throw new Error(MESSAGES.looksLikeId);
}

export function compress(file) {
  return new Promise((resolve, reject) => {
    if (/passport|identity|ghana\s*card|id[-_ ]?card|\bnrc\b|patient|child|baby|infant/i.test(file.name || "")) {
      reject(new Error(MESSAGES.fileNameBlocked));
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, LIMITS.photoEdge / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        screenPhoto(canvas);
      } catch (error) {
        reject(error);
        return;
      }
      resolve(canvas.toDataURL("image/jpeg", LIMITS.jpegQuality));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(MESSAGES.badImage));
    };
    image.src = url;
  });
}

export function pageLink() {
  return location.href.split("#")[0];
}
