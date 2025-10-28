// src/utils/paymentsApi.js
import { getApiBase } from "./apiBase";

const BASE = getApiBase();
if (!BASE) {
  // Ça évite des surprises si tu oublies la conf
  // (ce n'est pas bloquant : ça fera des appels relatifs /api/… sur la même origine)
  console.warn("[paymentsApi] VITE_API_URL / REACT_APP_API_URL non définie. Utilisation de l'origine courante.");
}

async function http(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function unwrapItems(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
}

export async function getPayments() {
  const data = await http("/api/paiements", { method: "GET" });
  return unwrapItems(data);
}

export async function addPayment(payload) {
  return await http("/api/paiements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addVersement(payload) {
  return await http("/api/paiements/versements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
