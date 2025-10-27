// src/pages/StatsPelerins.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ================= Config API ================= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ================= Helpers ================= */
const nowYear = new Date().getFullYear();

function mediaURL(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = API_BASE.replace(/\/+$/, "");
  const rel  = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}
function safeStr(x) { return (x ?? "").toString(); }

function ageFrom(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    let age = nowYear - d.getFullYear();
    const m = new Date();
    if (m.getMonth() < d.getMonth() || (m.getMonth() === d.getMonth() && m.getDate() < d.getDate())) age--;
    return isNaN(age) ? null : age;
  } catch { return null; }
}
function countBy(arr, keyFn) {
  return arr.reduce((acc, x) => {
    const k = keyFn(x) ?? "—";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}
function pct(count, total) {
  if (!total) return 0;
  return Math.round((count * 1000) / total) / 10; // 1 décimale
}
function cityFrom(address, fallback = "") {
  if (!address && fallback) address = fallback;
  if (!address) return "—";
  const s = String(address).trim();
  const parts = s.split(/[,|-]/).map((t) => t.trim()).filter(Boolean);
  if (!parts.length) return s;
  const candidate = parts.length >= 2 ? parts[parts.length - 1] : parts[0];
  return candidate.replace(/\s{2,}/g, " ");
}

/* ====== Palette + logique d'état (bleu-centric) ====== */
const ETAT_COLORS = {
  "Complet": { bar: "from-emerald-400/90 to-emerald-500/90", chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  "Photo pèlerin manquante": { bar: "from-blue-300/90 to-blue-500/90", chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  "Photo passeport manquante": { bar: "from-sky-300/90 to-sky-500/90", chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  "N° passeport manquant": { bar: "from-indigo-300/90 to-indigo-500/90", chip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  "À compléter": { bar: "from-rose-300/90 to-rose-500/90", chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};
function dossierState(x) {
  const lacksPhoto = !x.photoPelerin;
  const lacksPassPhoto = !x.photoPasseport;
  const lacksNum = !(x.numPasseport || "").trim();
  const missing = [lacksPhoto, lacksPassPhoto, lacksNum].filter(Boolean).length;
  if (missing === 0) return "Complet";
  if (missing > 1) return "À compléter";
  if (lacksPhoto) return "Photo pèlerin manquante";
  if (lacksPassPhoto) return "Photo passeport manquante";
  if (lacksNum) return "N° passeport manquant";
  return "À compléter";
}

/* ====== Normalisation d'un pèlerin depuis l'API ======
   On couvre les deux conventions possibles (snake_case & camelCase). */
function normalizePelerin(row = {}) {
  return {
    id: row.id ?? row._id ?? row.pelerin_id ?? null,

    // Médias (chemins servis par /uploads)
    photoPelerin: mediaURL(row.photo_pelerin_path || row.photoPelerin || ""),
    photoPasseport: mediaURL(row.photo_passeport_path || row.photoPasseport || ""),

    // Identité
    nom: safeStr(row.nom).toUpperCase(),
    prenoms: safeStr(row.prenoms),
    dateNaissance: row.date_naissance || row.dateNaissance || "",
    lieuNaissance: row.lieu_naissance || row.lieuNaissance || "",
    sexe: row.sexe || row.gender || "",

    // Contact / adresse
    adresse: row.adresse || "",
    contacts: row.contact || row.contacts || "",

    // Passeport & offre/voyage
    numPasseport: row.numPasseport || row.num_passeport || row.passeport || "",
    offre: row.offre || "",
    voyage: row.voyage || "",
    anneeVoyage: String(row.annee_voyage || row.anneeVoyage || ""),

    // Urgence
    urgenceNom: row.urNom || row.ur_nom || "",
    urgencePrenoms: row.urPrenoms || row.ur_prenoms || "",
    urgenceContact: row.urContact || row.ur_contact || "",
    urgenceResidence: row.urResidence || row.ur_residence || "",

    // Meta
    enregistrePar: row.created_by_name || row.createdByName || row.createdBy || "—",
    createdAt: row.created_at || row.createdAt || "",
  };
}

/* ====== Appels API ====== */
// ⚠️ Par défaut, on récupère toute la liste et on filtre côté client.
//    Si ton /api/pelerins supporte ?search= et ?year=, tu peux décommenter la section correspondante plus bas.
async function fetchPelerinsAll() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/pelerins`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items.map(normalizePelerin);
}

/* ================= Page ================= */
export default function StatsPelerins() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");

  const [rows, setRows] = useState([]);         // données normalisées
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const printRef = useRef(null);

  /* ---- Chargement initial ---- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // ===== Client-side filtering =====
        const list = await fetchPelerinsAll();
        setRows(list);

        // ===== SERVER-side filtering (optionnel) =====
        // const token = getToken();
        // const qs = new URLSearchParams();
        // if (query.trim()) qs.set("search", query.trim());
        // if (year !== "all") qs.set("year", year);
        // const res = await fetch(`${API_BASE}/api/pelerins?${qs}`, {
        //   headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        //   credentials: "include",
        // });
        // const data = await res.json();
        // if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
        // const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        // setRows(items.map(normalizePelerin));
      } catch (e) {
        setErr(e.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- Liste d'années à partir des données ---- */
  const years = useMemo(() => {
    const s = new Set(rows.map((d) => String(d.anneeVoyage || "")));
    s.delete("");
    return ["all", ...Array.from(s).sort()];
  }, [rows]);

  /* ---- Filtrage client (recherche + année) ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = rows.filter((p) => (year === "all" ? true : String(p.anneeVoyage) === String(year)));
    if (!q) return arr;
    return arr.filter((p) =>
      [
        p.nom, p.prenoms, p.sexe, p.numPasseport, p.offre, p.voyage, p.anneeVoyage,
        p.enregistrePar, p.lieuNaissance, p.adresse, p.urgenceResidence,
      ].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query, year]);

  const total = filtered.length;

  /* Agrégations */
  const bySexe   = useMemo(() => countBy(filtered, (x) => x.sexe || "Non précisé"), [filtered]);
  const byOffre  = useMemo(() => countBy(filtered, (x) => x.offre || "—"), [filtered]);
  const byVoyage = useMemo(() => countBy(filtered, (x) => x.voyage || "—"), [filtered]);
  const byYear   = useMemo(() => countBy(filtered, (x) => x.anneeVoyage || "—"), [filtered]);
  const byEtat   = useMemo(() => countBy(filtered, dossierState), [filtered]);

  const byResidence = useMemo(() => {
    const m = countBy(filtered, (x) => cityFrom(x.adresse, x.urgenceResidence));
    const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
    if (entries.length <= 10) return m;
    const top = entries.slice(0, 10);
    const rest = entries.slice(10).reduce((s, [, n]) => s + n, 0);
    return Object.fromEntries([...top, ["Autres", rest]]);
  }, [filtered]);

  const ages = filtered.map((x) => ageFrom(x.dateNaissance)).filter((a) => a !== null);
  const avgAge = ages.length ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10 : "—";
  const buckets = useMemo(() => {
    const init = { "≤ 25": 0, "26–35": 0, "36–45": 0, "46–55": 0, "56–65": 0, "≥ 66": 0 };
    for (const a of ages) {
      if (a <= 25) init["≤ 25"]++;
      else if (a <= 35) init["26–35"]++;
      else if (a <= 45) init["36–45"]++;
      else if (a <= 55) init["46–55"]++;
      else if (a <= 65) init["56–65"]++;
      else init["≥ 66"]++;
    }
    return init;
  }, [ages]);

  const photoOk          = filtered.filter((x) => !!x.photoPelerin).length;
  const passeportPhotoOk = filtered.filter((x) => !!x.photoPasseport).length;
  const passeportNumOk   = filtered.filter((x) => !!(x.numPasseport || "").trim()).length;
  const completeCount    = filtered.filter(
    (x) => !!x.photoPelerin && !!x.photoPasseport && !!(x.numPasseport || "").trim()
  ).length;
  const completenessPct  = pct(completeCount, total);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 text-dyn" ref={printRef}>
      {/* EN-TÊTE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Statistiques — Pèlerins</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Vue d’ensemble des inscriptions et de la complétude des dossiers.
          {loading ? " · Chargement…" : err ? ` · ${err}` : ""}
        </p>
      </div>

      {/* BARRE D’ACTIONS */}
      <div className="print:hidden flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 text-slate-900 shadow-sm flex-1">
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (nom, passeport, agent, ville...)"
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
            />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y === "all" ? "Toutes les années" : y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="print:hidden flex gap-2">
          <button
            onClick={handlePrint}
            className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            disabled={loading}
          >
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* ENTÊTE IMPRESSION */}
      <div className="hidden print:block">
        <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4 text-black">
          <div className="flex items-center justify-between">
            <div className="text-xl font-extrabold">BMVT — Tableau de bord statistiques</div>
            <div className="text-sm">Généré le : {new Date().toLocaleString()}</div>
          </div>
          <div className="text-sm mt-1">
            Filtre: {year === "all" ? "Toutes les années" : year}
            {query ? ` • Recherche: “${query}”` : ""}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi title="Total" value={total} />
        <Kpi title="Âge moyen" value={avgAge} hint={avgAge !== "—" ? "années" : ""} />
        <Kpi title="Avec photo" value={`${photoOk}/${total}`} hint={`${pct(photoOk, total)}%`} />
        <Kpi title="N° Passeport" value={`${passeportNumOk}/${total}`} hint={`${pct(passeportNumOk, total)}%`} />
        <Kpi title="Dossier complet" value={`${completeCount}/${total}`} hint={`${completenessPct}%`}>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(byEtat).map(([label, n]) => (
              <span
                key={label}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${ETAT_COLORS[label]?.chip || "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}
              >
                {label}: {n}
              </span>
            ))}
          </div>
        </Kpi>
      </section>

      {/* Graphs — responsive */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Répartition par sexe"><Bars data={bySexe} total={total} /></Card>
        <Card title="Répartition par offre"><Bars data={byOffre} total={total} /></Card>
        <Card title="Types de voyage"><Bars data={byVoyage} total={total} /></Card>
        <Card title="Inscriptions par année"><Bars data={byYear} total={total} /></Card>
        <Card title="Répartition par résidence (ville)"><Bars data={byResidence} total={total} /></Card>
        <Card title="Tranches d’âge (estimées)"><Bars data={buckets} total={total} /></Card>

        <Card title="Complétude du dossier">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Donut label="Photo pèlerin" value={photoOk} total={total} />
            <Donut label="N° Passeport" value={passeportNumOk} total={total} />
            <Donut label="Photo passeport" value={passeportPhotoOk} total={total} />
          </div>
          <div className="mt-4">
            <Progress label="Taux global" value={completenessPct} />
          </div>
        </Card>

        <Card title="État du dossier (coloré)">
          <ColoredBars data={byEtat} total={total} />
          <div className="mt-3 flex flex-wrap gap-2 text-dyn-sm">
            {Object.entries(byEtat).map(([label, n]) => (
              <span
                key={label}
                className={`rounded-lg px-2 py-1 font-semibold ${ETAT_COLORS[label]?.chip || "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}
              >
                {label}: {n} • {pct(n, total)}%
              </span>
            ))}
          </div>
        </Card>

        <Card title="Top 5 — Agents (inscriptions)">
          <TopList counts={countBy(filtered, (x) => x.enregistrePar || "—")} total={total} top={5} />
        </Card>

        <Card title="Récapitulatif rapide">
          <Recap total={total} bySexe={bySexe} byYear={byYear} byOffre={byOffre} />
        </Card>
      </section>

      {/* Styles d’impression */}
      <style>{`
        @page { size: A4 portrait; margin: 14mm; }
        @media print {
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print-card { background: #fff !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; color: #111827 !important; }
          .print-title { color: #111827 !important; }
        }
      `}</style>
    </div>
  );
}

/* ================= UI building blocks ================= */
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 text-slate-900 shadow-sm print-card">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-200 text-dyn-sm font-extrabold print-title">
        {title}
      </div>
      {children}
    </div>
  );
}
function Kpi({ title, value, hint, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 text-slate-900 shadow-sm print-card">
      <div className="text-[11px] md:text-[12px] uppercase tracking-wider text-slate-500 print:text-black">{title}</div>
      <div className="mt-1 text-xl md:text-2xl font-extrabold text-blue-700 print:text-black">{value}</div>
      {hint ? <div className="text-dyn-sm text-slate-500 print:text-black mt-1">{hint}</div> : null}
      {children}
    </div>
  );
}
function Bars({ data, total }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <p className="text-slate-500 print:text-black">—</p>;
  const max = Math.max(...entries.map(([, v]) => v || 0), 1);
  return (
    <ul className="space-y-2">
      {entries.map(([label, count]) => (
        <li key={label} className="grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between text-dyn-sm">
            <span className="truncate text-slate-800 print:text-black">{label}</span>
            <span className="text-slate-500 print:text-black">{count} • {pct(count, total)}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden print:bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400/80 to-blue-600/80 print:bg-blue-600"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
function ColoredBars({ data, total }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <p className="text-slate-500 print:text-black">—</p>;
  const max = Math.max(...entries.map(([, v]) => v || 0), 1);

  return (
    <ul className="space-y-2">
      {entries.map(([label, count]) => {
        const grad = ETAT_COLORS[label]?.bar || "from-slate-300/70 to-slate-400/70";
        return (
          <li key={label} className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between text-dyn-sm">
              <span className="truncate text-slate-800 print:text-black">{label}</span>
              <span className="text-slate-500 print:text-black">{count} • {pct(count, total)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden print:bg-gray-200">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${grad} print:bg-blue-600`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
function Donut({ label, value, total }) {
  const size = 110, stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total ? value / total : 0;
  const dash = Math.max(0, Math.min(c, c * ratio));
  return (
    <div className="grid place-items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" className="print:stroke-gray-200" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#grad)"
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={`${dash} ${c-dash}`} className="print:stroke-blue-600"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(96,165,250,.95)" />
            <stop offset="100%" stopColor="rgba(37,99,235,.95)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-lg font-extrabold text-blue-700 print:text-black">{pct(value, total)}%</div>
        <div className="text-dyn-sm text-slate-600 print:text-black">{label}</div>
      </div>
    </div>
  );
}
function Progress({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-dyn-sm">
        <span className="text-slate-700 print:text-black">{label}</span>
        <span className="text-blue-700 font-semibold print:text-black">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden print:bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400/80 to-blue-600/80 print:bg-blue-600"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
function TopList({ counts, total, top = 5 }) {
  const items = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]).slice(0, top);
  if (!items.length) return <p className="text-slate-500 print:text-black">—</p>;
  return (
    <ul className="space-y-2">
      {items.map(([label, n]) => (
        <li key={label} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <span className="truncate print:text-black">{label}</span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 text-dyn-sm ring-1 ring-blue-200 print:bg-blue-100 print:text-blue-800">
            {n} • {pct(n, total)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
function Recap({ total, bySexe, byYear, byOffre }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[520px] text-dyn-sm">
        <tbody className="[&_tr+tr]:border-t [&_tr+tr]:border-slate-200 print:[&_tr+tr]:border-gray-200">
          <tr>
            <td className="py-2 pr-3 text-slate-600 print:text-black">Total</td>
            <td className="py-2 print:text-black">{total}</td>
          </tr>
          <tr>
            <td className="py-2 pr-3 text-slate-600 print:text-black">Masculin / Féminin</td>
            <td className="py-2 print:text-black">{(bySexe["Masculin"] || 0)} / {(bySexe["Féminin"] || 0)}</td>
          </tr>
          <tr>
            <td className="py-2 pr-3 text-slate-600 print:text-black">Années</td>
            <td className="py-2 print:text-black">
              {Object.entries(byYear).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([y, n]) => `${y}: ${n}`).join(" • ")}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-3 text-slate-600 print:text-black">Offres</td>
            <td className="py-2 print:text-black">
              {Object.entries(byOffre).sort((a, b) => b[1] - a[1]).map(([o, n]) => `${o}: ${n}`).join(" • ")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
