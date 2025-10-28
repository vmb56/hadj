// src/pages/paiement/HistoriquesVersements.jsx
import React, { useMemo, useState, useEffect } from "react";

/* --------------------------------------------------------------------------
   CONFIG API — aligné sur RecherchePaiement.jsx
-------------------------------------------------------------------------- */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ----------------------------- helper GET JSON ----------------------------- */
async function getJson(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    credentials: "include",
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* --------------------------------- FORMAT --------------------------------- */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n)) ? "0" : Number(n).toLocaleString("fr-FR");

/* ------------------------------ NORMALISATIONS ----------------------------- */
// Versement (vient de /api/paiements/versements)
// Back (USE_SNAKE_CASE=false) => camelCase natif: id, passeport, nom, prenoms, echeance, verse, restant, statut, createdAt, updatedAt
function normalizeVersement(r = {}) {
  return {
    id: r.id,
    passeport: r.passeport ?? r.num_passeport ?? r.NUM_PASSEPORT ?? "",
    nom: r.nom ?? "",
    prenoms: r.prenoms ?? "",
    echeance: r.echeance ?? r.date ?? r.date_paiement ?? null,
    verse: Number(r.verse ?? r.montant ?? r.montant_paye ?? 0),
    restant: Number(r.restant ?? r.reste ?? 0),
    statut: r.statut ?? "",
  };
}

/* ---------------------------------- API ----------------------------------- */
const api = {
  /**
   * Récupère les versements depuis /api/paiements/versements
   * - Si "passeport" est fourni, on appelle côté serveur avec ?passeport=XXXX
   * - Sinon on récupère la liste globale (limit 1000 côté serveur)
   */
  async getVersements({ passeport = "" } = {}) {
    const url = new URL(`${API_BASE}/api/paiements/versements`);
    if (passeport) url.searchParams.set("passeport", passeport);
    const data = await getJson(url.toString());
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeVersement);
  },
};

/* ==================================================================== */
export default function HistoriquesVersements() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      // On tente d'utiliser le filtre serveur par passeport si l'utilisateur a saisi quelque chose.
      // (Ton endpoint ne sait filtrer QUE par passeport — le reste est filtré côté client.)
      const passeport = q.trim();
      const items = await api.getVersements({ passeport });
      setRows(items);
    } catch (e) {
      setErr(e.message || "Impossible de charger les versements");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chargement initial: sans filtre => récupère la liste globale (limit 1000)
    (async () => {
      try {
        setLoading(true);
        const items = await api.getVersements({ passeport: "" });
        setRows(items);
      } catch (e) {
        setErr(e.message || "Impossible de charger les versements");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrage client (nom, prenoms, statut) pour affiner l’affichage
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((x) =>
      `${x.passeport} ${x.nom} ${x.prenoms} ${x.statut}`.toLowerCase().includes(s)
    );
  }, [q, rows]);

  const totalVerse = useMemo(
    () => filtered.reduce((t, x) => t + Number(x.verse || 0), 0),
    [filtered]
  );
  const totalRestant = useMemo(
    () => filtered.reduce((t, x) => t + Number(x.restant || 0), 0),
    [filtered]
  );

  return (
    <div className="space-y-4 text-dyn">
      {/* En-tête (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-dyn-title font-extrabold text-slate-900">
              Historiques des Versements
            </h2>
            <p className="mt-1 text-dyn-sm text-slate-600">
              Suivi des acomptes, échéances et restes à payer.
            </p>
            <div className="mt-2 text-[12.5px] text-slate-600">
              {filtered.length} élément(s) • Versé:{" "}
              <span className="font-semibold text-slate-900">{fmt(totalVerse)} FCFA</span>{" "}
              • Restant:{" "}
              <span className="font-semibold text-slate-900">{fmt(totalRestant)} FCFA</span>
            </div>
            {loading && <div className="text-slate-500 text-xs mt-1">Chargement…</div>}
            {err && (
              <div className="text-rose-600 text-xs mt-1">
                {err}
                <div className="text-[11px] text-slate-500 mt-1">
                  API_BASE: <span className="font-mono">{API_BASE || "(vide)"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (passeport, nom, statut...)"
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 placeholder:text-slate-400"
            />
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50 disabled:opacity-60"
              onClick={reload}
              disabled={loading}
              type="button"
            >
              {loading ? "Chargement…" : "Actualiser"}
            </button>
          </div>
        </div>
      </div>

      {/* Tableau (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] text-[14.5px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 uppercase tracking-wide text-[12.5px]">
                <Th>#</Th>
                <Th>Passeport</Th>
                <Th>Nom &amp; Prénoms</Th>
                <Th>Échéance</Th>
                <Th>Versé</Th>
                <Th>Restant</Th>
                <Th className="text-right">Statut</Th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-slate-200">
              {filtered.map((x, i) => (
                <tr
                  key={x.id || `${x.passeport}-${x.echeance}-${i}`}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <Td className="text-slate-600">{i + 1}</Td>
                  <Td className="font-mono text-slate-800">{x.passeport}</Td>
                  <Td className="text-slate-900">
                    {x.nom} {x.prenoms}
                  </Td>
                  <Td className="text-slate-600">{x.echeance || "—"}</Td>
                  <Td className="font-semibold text-slate-900">{fmt(x.verse)} FCFA</Td>
                  <Td className="text-slate-800">{fmt(x.restant)} FCFA</Td>
                  <Td className="text-right">
                    <StatusChip value={x.statut} />
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <Td colSpan={7} className="text-center text-slate-500 py-6">
                    Aucun versement trouvé
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- Sous-blocs ---- */
function StatusChip({ value }) {
  const v = String(value || "").toLowerCase();
  const base = "rounded-lg px-2 py-0.5 text-[12px] font-semibold";
  const style =
    v === "soldé"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : v === "en retard"
      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
      : v === "en cours"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <span className={`${base} ${style}`}>{value || "—"}</span>;
}
function Th({ children, className = "" }) {
  return <th className={`text-left px-4 py-3 whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>;
}
