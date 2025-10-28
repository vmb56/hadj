// src/utils/pelerinsApi.js
import { getApiBase } from "./apiBase";

const BASE = getApiBase();
if (!BASE) {
  console.warn("[pelerinsApi] VITE_API_URL / REACT_APP_API_URL non définie. Utilisation de l'origine courante.");
}

async function http(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

function unwrapItems(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
}

export async function getPelerins({ query = "", offre = "" } = {}) {
  const sp = new URLSearchParams();
  if (query) sp.set("query", query);
  if (offre && offre !== "TOUTES") sp.set("offre", offre);
  const qs = sp.toString() ? `?${sp.toString()}` : "";

  const data = await http(`/api/pelerins${qs}`);
  const items = unwrapItems(data);

  // Adapte les noms de champs à ta réponse réelle
  return items.map((r) => ({
    id: r.id,
    nom: r.nom,
    prenoms: r.prenoms,
    passeport: r.passeport,
    offre: r.offre,
    hotel: r.hotel,
    prixOffre: Number(r.prixOffre || 0),
    contact: r.contact,
    photoPelerin: r.photoPelerinUrl ?? r.photoPelerin ?? "",
    photoPasseport: r.photoPasseportUrl ?? r.photoPasseport ?? "",
  }));
}
