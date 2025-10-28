// src/utils/apiBase.js
export function getApiBase() {
  let viteUrl;
  try {
    // ok en Vite; ignoré en CRA (import.meta absent)
    viteUrl = typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL;
  } catch {
    viteUrl = undefined;
  }

  const craUrl =
    typeof process !== "undefined" &&
    process?.env &&
    (process.env.REACT_APP_API_URL || process.env.API_URL);

  const winUrl =
    typeof window !== "undefined" && typeof window.__API_URL__ !== "undefined"
      ? window.__API_URL__
      : undefined;

  let u = viteUrl || craUrl || winUrl || ""; // fallback: même origine

  if (typeof u !== "string") u = String(u ?? "");
  return u.replace(/\/+$/, ""); // retire les slashs de fin
}
