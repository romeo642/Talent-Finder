const KEY = "tf-home-country";

export function readHomeCountry(): string {
  if (typeof localStorage === "undefined") return "";
  const value = (localStorage.getItem(KEY) ?? "").toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : "";
}

export function saveHomeCountry(code: string): void {
  const value = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(value) || typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, value);
}
