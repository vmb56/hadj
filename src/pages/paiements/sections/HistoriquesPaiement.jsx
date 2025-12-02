// src/pages/paiement/HistoriquesPaiement.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ======================= Connexion API BMVT (prod Render) ======================= */
/**
 * On force l’URL backend en prod :
 *   https://hadjbackend.onrender.com
 * + Auth par token "bmvt_token"
 * + PAS de cookies (credentials: "omit")
 */
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ----------------------------- HTTP helper ----------------------------- */
async function http(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    // 🔒 on NE transmet PAS les cookies au backend Render
    credentials: "omit",
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ----------------------------- Normalisation ---------------------------- */
function normalizePayment(r = {}) {
  return {
    id: r.id,
    ref: r.ref ?? "",
    passeport: r.passeport ?? "",
    nom: r.nom ?? "",
    prenoms: r.prenoms ?? "",
    mode: r.mode ?? "",
    montant: Number(r.montant ?? r.montant_paye ?? 0),
    totalDu: Number(r.totalDu ?? r.total_du ?? 0),
    reduction: Number(r.reduction ?? 0),
    date: r.date ?? r.date_paiement ?? "",
    statut: r.statut ?? "",
    createdAt: r.createdAt ?? r.created_at ?? null,
    updatedAt: r.updatedAt ?? r.updated_at ?? null,
  };
}

/* ------------------------------- API calls ------------------------------ */
async function apiGetPaiements({ passeport = "" } = {}) {
  const url = new URL(`${API_BASE}/api/paiements`);
  // ⚠️ Ton backend filtre par "passeport" (query string)
  if (passeport) url.searchParams.set("passeport", passeport);
  const data = await http(url.toString());
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map(normalizePayment);
}

/* ==================================================================== */
export default function HistoriquesPaiement() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      // Côté serveur, le filtre supporté est ?passeport=XXXX
      const passeport = q.trim();
      const items = await apiGetPaiements({ passeport });
      setRows(items);
    } catch (e) {
      setErr(e.message || "Impossible de charger les paiements");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chargement initial : sans filtre -> liste globale (limit 1000 côté serveur)
    (async () => {
      try {
        setLoading(true);
        const items = await apiGetPaiements({ passeport: "" });
        setRows(items);
      } catch (e) {
        setErr(e.message || "Impossible de charger les paiements");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtre client (réf., nom, mode, statut...) pour affiner l’affichage
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((x) =>
      `${x.ref} ${x.passeport} ${x.nom} ${x.prenoms} ${x.mode} ${x.statut}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, rows]);

  const totalMontant = useMemo(
    () => filtered.reduce((t, x) => t + Number(x.montant || 0), 0),
    [filtered]
  );

  return (
    <div className="space-y-4 text-dyn">
      {/* En-tête carte */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-dyn-title font-extrabold text-slate-900">
              Historiques des Paiements
            </h2>
            <p className="mt-1 text-dyn-sm text-slate-600">
              Transactions enregistrées (référence, mode, montant, statut).
            </p>
            <div className="mt-2 text-[12.5px] text-slate-600">
              {filtered.length} élément(s) • Total montants :{" "}
              <span className="font-semibold text-slate-900">
                {totalMontant.toLocaleString("fr-FR")} FCFA
              </span>
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
              placeholder="Rechercher (passeport pour filtrer serveur, sinon filtre local)"
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 placeholder:text-slate-400"
            />
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50"
              onClick={reload}
              type="button"
              disabled={loading}
            >
              {loading ? "Chargement…" : "Actualiser"}
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] text-[14.5px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 uppercase tracking-wide text-[12.5px]">
                <Th>#</Th>
                <Th>Réf.</Th>
                <Th>Passeport</Th>
                <Th>Nom &amp; Prénoms</Th>
                <Th>Mode</Th>
                <Th>Montant payé</Th>
                <Th>Total dû</Th>
                <Th>Réduction</Th>
                <Th>Date</Th>
                <Th className="text-right">Statut</Th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-slate-200">
              {filtered.map((x, i) => (
                <tr
                  key={x.id || `${x.passeport}-${x.ref || i}`}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <Td className="text-slate-600">{i + 1}</Td>
                  <Td className="font-medium text-slate-900">{x.ref || "—"}</Td>
                  <Td className="font-mono text-slate-800">{x.passeport}</Td>
                  <Td className="text-slate-900">
                    {x.nom} {x.prenoms}
                  </Td>
                  <Td className="text-slate-700">{x.mode}</Td>
                  <Td className="font-semibold text-slate-900">
                    {Number(x.montant || 0).toLocaleString("fr-FR")} FCFA
                  </Td>
                  <Td className="text-slate-800">
                    {Number(x.totalDu || 0).toLocaleString("fr-FR")} FCFA
                  </Td>
                  <Td className="text-slate-700">
                    {Number(x.reduction || 0).toLocaleString("fr-FR")} FCFA
                  </Td>
                  <Td className="text-slate-600">{x.date || "—"}</Td>
                  <Td className="text-right">
                    <StatusChip value={x.statut} />
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <Td colSpan={10} className="text-center text-slate-500 py-6">
                    Aucun paiement trouvé
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
    v === "complet"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : v === "partiel"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : v === "en attente" || v === "en cours"
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <span className={`${base} ${style}`}>{value || "—"}</span>;
}
function Th({ children, className = "" }) {
  return <th className={`text-left px-4 py-3 whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}
