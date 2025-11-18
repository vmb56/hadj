// src/pages/Factures.jsx
import React, { useEffect, useState } from "react";
import Logo from "../../src/pages/pelerins/Logo.png";

/* ========= Config API (CRA OK) ========= */
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

/* ========= Utils ========= */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("fr-FR");

const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = toISO(new Date());

function ymd(x) {
  // normalise en YYYY-MM-DD
  if (!x) return "";
  if (/^\d{8}$/.test(x)) {
    // 20250605 -> 2025-06-05
    return `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}`;
  }
  const s = String(x).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(x);
  return isNaN(d) ? "" : toISO(d);
}

/* ========= Normalisation d’un versement ========= */
function normalizeVersement(row = {}, idx = 0) {
  const id = row.id ?? `VRS-${idx + 1}`;
  const passeport = row.passeport ?? row.passport ?? "";
  const nom = row.nom ?? "";
  const prenoms = row.prenoms ?? "";
  const verse = Number(row.verse ?? 0);
  const restant = Number(row.restant ?? 0);
  const total = Number(
    row.total ?? row.totalDu ?? row.total_du ?? verse + restant
  );
  const createdAt = row.createdAt || row.created_at || null;
  const updatedAt = row.updatedAt || row.updated_at || null;

  const dateVersement =
    ymd(row.echeance) || ymd(createdAt) || ymd(updatedAt) || "";

  return {
    id,
    passeport,
    nom,
    prenoms,
    verse,
    restant,
    total,
    statut: row.statut ?? "",
    dateVersement, // YYYY-MM-DD "logique"
    dateVersementRaw: row.echeance ?? "",
    createdAt,
    updatedAt,
  };
}

function bestDate(v) {
  return (
    ymd(v.dateVersement) ||
    ymd(v.dateVersementRaw) ||
    ymd(v.createdAt) ||
    ymd(v.updatedAt) ||
    ""
  );
}

/* ========= Impression HTML (2 exemplaires sur A4) ========= */
function openPrintWindow(v, { logoUrl, watermarkText }) {
  const style = `
    body{
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
      margin:0;
      padding:16px;
      color:#020617;
      background:#f1f5f9;
    }
    .sheet{
      width:210mm;
      margin:0 auto;
      box-sizing:border-box;
    }
    .facture{
      position:relative;
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:16mm 18mm;
      margin-bottom:14mm;
      min-height:128mm;
      background:white;
      box-shadow:0 10px 30px rgba(15,23,42,0.08);
      overflow:hidden;
    }
    .entete{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
    }
    .brand{
      display:flex;
      align-items:center;
      gap:12px;
    }
    .brand img{
      width:54px;
      height:54px;
      object-fit:contain;
      border-radius:999px;
      border:2px solid #e5e7eb;
      padding:4px;
      background:white;
    }
    .brand-title{
      font-weight:900;
      font-size:18px;
      letter-spacing:.06em;
      text-transform:uppercase;
      color:#0f172a;
    }
    .brand-sub{
      font-size:12px;
      color:#475569;
      margin-top:3px;
    }
    .title{
      font-size:22px;
      font-weight:900;
      letter-spacing:.06em;
      color:#b91c1c;
      text-align:center;
      margin:14px 0 10px;
      text-transform:uppercase;
    }
    .title-chip{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:4px 10px;
      border-radius:999px;
      background:#fef2f2;
      border:1px solid #fecaca;
      font-size:11px;
      font-weight:600;
      color:#991b1b;
    }
    .meta{
      font-size:11px;
      color:#111827;
      text-align:right;
      line-height:1.4;
    }
    .meta-label{
      font-size:10px;
      text-transform:uppercase;
      letter-spacing:.08em;
      color:#9ca3af;
    }
    .meta-val{
      font-weight:600;
    }
    .grid{
      margin-top:10mm;
      display:grid;
      grid-template-columns: 1.3fr 1.1fr 1.1fr;
      gap:8px 22px;
      font-size:13px;
    }
    .lbl{
      color:#0f172a;
      font-weight:700;
      text-transform:uppercase;
      font-size:11px;
      letter-spacing:.04em;
    }
    .val{
      color:#020617;
      font-weight:500;
    }
    .money{
      font-family:ui-monospace, SFMono-Regular, Menlo, Menlo-Regular, Menlo, monospace;
      font-size:13px;
    }
    .money strong{
      font-size:14px;
    }
    .signs{
      display:flex;
      justify-content:space-between;
      margin-top:14mm;
      font-size:12px;
      gap:20mm;
    }
    .sig{
      flex:1;
      border-top:1px dashed #9ca3af;
      padding-top:3mm;
      text-align:center;
      color:#111827;
      text-transform:uppercase;
      letter-spacing:.06em;
      font-weight:600;
    }
    .wm{
      position:absolute;
      left:50%;
      top:52%;
      transform:translate(-50%,-50%) rotate(-14deg);
      font-weight:900;
      font-size:110px;
      color: rgba(59,130,246,0.06);
      letter-spacing: 0.14em;
      text-transform:uppercase;
      user-select:none;
      pointer-events:none;
      white-space:nowrap;
    }
    .footer-note{
      position:absolute;
      left:18mm;
      bottom:8mm;
      font-size:10px;
      color:#9ca3af;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    .copy-label{
      position:absolute;
      right:18mm;
      bottom:8mm;
      font-size:11px;
      color:#0f172a;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:.12em;
    }
    @page{
      size:A4;
      margin:8mm;
    }
  `;

  const now = new Date();
  const nowDate = now.toLocaleDateString("fr-FR");
  const nowTime = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const logo = logoUrl || Logo;
  const wm = watermarkText || "BMVT";

  const bloc = (copyLabel) => `
    <div class="facture" role="document" aria-label="Facture versement">
      <div class="wm">${wm}</div>

      <div class="entete">
        <div class="brand">
          <img src="${Logo}" alt="logo"/>
          <div>
            <div class="brand-title">BMVT</div>
            <div class="brand-sub">Bakayoko Mawa Voyages et Tourismes</div>
          </div>
        </div>
        <div class="meta">
          <div class="meta-label">Émis le</div>
          <div class="meta-val">${nowDate} à ${nowTime}</div>
          <div style="margin-top:4px;" class="meta-label">Réf. facture</div>
          <div class="meta-val">${v.id}</div>
        </div>
      </div>

      <div class="title">
        FACTURE VERSEMENT
        <div style="margin-top:6px;">
          <span class="title-chip">Hajj / Umra — Paiement partiel</span>
        </div>
      </div>

      <div class="grid">
        <div class="lbl">Numéro de passeport du pèlerin :</div>
        <div class="val" style="grid-column: span 2">
          ${v.passeport || "—"}
        </div>

        <div class="lbl">Identifiant de versement :</div>
        <div class="val" style="grid-column: span 2">
          ${v.id}
        </div>

        <div class="lbl">Date de versement :</div>
        <div class="val" style="grid-column: span 2">
          ${v.dateVersement || bestDate(v) || "—"}
        </div>

        <div class="lbl">Nom du pèlerin :</div>
        <div class="val" style="grid-column: span 2">
          ${v.nom || "—"}
        </div>

        <div class="lbl">Prénoms du pèlerin :</div>
        <div class="val" style="grid-column: span 2">
          ${v.prenoms || "—"}
        </div>

        <div class="lbl">Montant TTC du voyage :</div>
        <div class="val money"><strong>${fmt(v.total)}</strong>&nbsp;FCFA</div>
        <div></div>

        <div class="lbl">Montant du versement :</div>
        <div class="val money"><strong>${fmt(v.verse)}</strong>&nbsp;FCFA</div>
        <div></div>

        <div class="lbl">Reste du paiement :</div>
        <div class="val money"><strong>${fmt(v.restant)}</strong>&nbsp;FCFA</div>
        <div></div>
      </div>

      <div class="signs">
        <div class="sig">Signature du pèlerin</div>
        <div class="sig">Signature de l'agent BMVT</div>
      </div>

      <div class="footer-note">Reçu à conserver précieusement</div>
      <div class="copy-label">${copyLabel}</div>
    </div>
  `;

  const html = `
    <html><head><title>Facture Versement</title><meta charset="utf-8"/>
    <style>${style}</style></head>
    <body>
      <div class="sheet">
        ${bloc("COPIE PÈLERIN")}
        ${bloc("COPIE AGENCE")}
      </div>
      <script>window.onload = () => window.print();</script>
    </body></html>
  `;

  const pop = window.open("", "_blank", "width=1200,height=800");
  if (!pop) return;
  pop.document.write(html);
  pop.document.close();
}

/* =========================== Page =========================== */
export default function Factures() {
  const [passport, setPassport] = useState("");
  const [mode, setMode] = useState("single"); // "single" | "range"
  const [dateSingle, setDateSingle] = useState(todayISO);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "sold" | "nonsold"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState([]); // liste de versements trouvés pour ce pass

  const mainSelected =
    mode === "single" && results.length > 0 ? results[0] : null;

  /* ===== Recherche automatique (debounce) ===== */
  useEffect(() => {
    setErr("");
    setResults([]);

    const passClean = (passport || "").replace(/\s+/g, "").toUpperCase();

    if (!passClean || passClean.length < 3) {
      setLoading(false);
      return;
    }

    let dateCondOk = false;
    let wantedSingle = "";
    let startWanted = "";
    let endWanted = "";

    if (mode === "single") {
      wantedSingle = ymd(dateSingle);
      dateCondOk = !!wantedSingle;
    } else {
      startWanted = ymd(dateStart);
      endWanted = ymd(dateEnd);
      if (startWanted && endWanted && startWanted > endWanted) {
        const tmp = startWanted;
        startWanted = endWanted;
        endWanted = tmp;
      }
      dateCondOk = !!startWanted && !!endWanted;
    }

    if (!dateCondOk) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const token = getToken();
        const base = API_BASE.replace(/\/+$/, "");
        const url = new URL(`${base}/api/paiements/versements`);
        url.searchParams.set("passeport", passClean);

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = j?.message || j?.error || msg;
          } catch {}
          throw new Error(msg);
        }
        const payload = await res.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        const items = list.map(normalizeVersement);

        if (cancelled) return;

        if (mode === "single") {
          const matches = items.filter((v) => {
            const d = bestDate(v);
            return d && d === wantedSingle;
          });

          if (!matches.length) {
            setErr("Aucun versement trouvé pour ce passeport à cette date.");
            setResults([]);
          } else {
            setResults(matches);
          }
        } else {
          // Filtre par intervalle
          let matches = items.filter((v) => {
            const d = bestDate(v);
            return d && d >= startWanted && d <= endWanted;
          });

          // Filtre par statut (soldé / non soldé / tous)
          matches = matches.filter((v) => {
            if (statusFilter === "all") return true;
            const st = (v.statut || "").toLowerCase();
            const isSold = st.includes("sold"); // ex: "soldé", "soldé totalement"
            if (statusFilter === "sold") return isSold;
            if (statusFilter === "nonsold") return !isSold;
            return true;
          });

          if (!matches.length) {
            setErr(
              "Aucun versement trouvé pour ce passeport dans cet intervalle et avec ce statut."
            );
            setResults([]);
          } else {
            setResults(matches);
          }
        }
      } catch (e2) {
        if (cancelled) return;
        setErr(e2.message || "Échec de la recherche.");
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [passport, mode, dateSingle, dateStart, dateEnd, statusFilter]);

  function handlePrintOne(v) {
    if (!v) {
      alert("Aucun versement sélectionné.");
      return;
    }
    openPrintWindow(v, {
      logoUrl: Logo,
      watermarkText: "BMVT",
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 py-4 sm:py-6 space-y-5 text-dyn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 shadow-sm">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white/80 grid place-items-center shadow-sm">
              <span className="text-xl">🧾</span>
            </div>
            <div>
              <h1 className="text-dyn-title font-extrabold text-slate-900">
                Facture de versement
              </h1>
              <p className="mt-1 text-dyn-sm text-slate-600 max-w-xl">
                Imprime la facture d’un pèlerin soit pour{" "}
                <span className="font-semibold text-sky-700">une date donnée</span>, soit
                pour <span className="font-semibold text-sky-700">un intervalle</span> de
                dates, avec filtre sur le{" "}
                <span className="font-semibold text-sky-700">statut du paiement</span>.
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Agence&nbsp;:{" "}
                <span className="font-semibold">
                  Bakayoko Mawa Voyages et Tourismes
                </span>
              </p>
            </div>
          </div>

          <div className="md:ml-auto flex items-center gap-3 text-[12px] text-slate-500">
            <div className="hidden sm:block h-10 w-px bg-slate-200" />
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-700">
                  Service paiements
                </span>
              </div>
              <div>Hajj / Umra &mdash; BMVT</div>
              <div className="text-slate-500">
                {loading
                  ? "Recherche en cours…"
                  : "Recherche automatique dès que les champs sont remplis."}
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="border-t border-rose-100 bg-rose-50/80 px-5 py-2.5 flex items-center gap-2 text-[13px] text-rose-700">
            <span className="text-base">⚠️</span>
            <span>{err}</span>
          </div>
        )}
      </div>

      {/* Formulaire + aperçu */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] items-start">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-extrabold text-slate-900">
                Paramètres de recherche
              </h2>
              <p className="text-[13px] text-slate-500">
                Saisis le passeport du pèlerin, choisis le mode, les dates, et le statut.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 whitespace-nowrap">
                {results.length
                  ? `${results.length} versement(s) trouvé(s)`
                  : "Aucun résultat pour le moment"}
              </span>
            </div>
          </div>

          <form
            className="mt-2 flex flex-col gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1">
                <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  Passeport du pèlerin
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 font-mono shadow-sm"
                  placeholder="Ex : 23AP18311"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimum 3 caractères. Les espaces sont ignorés.
                </p>
              </div>

              <div className="w-full md:w-[230px]">
                <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
                  Mode de recherche
                </label>
                <div className="flex rounded-xl border border-slate-300 bg-slate-50 p-1 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setMode("single")}
                    className={
                      "flex-1 rounded-lg px-2 py-1 font-semibold " +
                      (mode === "single"
                        ? "bg-white text-sky-700 shadow-sm border border-sky-100"
                        : "text-slate-600")
                    }
                  >
                    Une date
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("range")}
                    className={
                      "flex-1 rounded-lg px-2 py-1 font-semibold " +
                      (mode === "range"
                        ? "bg-white text-sky-700 shadow-sm border border-sky-100"
                        : "text-slate-600")
                    }
                  >
                    Intervalle
                  </button>
                </div>
              </div>
            </div>

            {/* Dates + statut selon mode */}
            {mode === "single" ? (
              <div className="w-full sm:w-[260px]">
                <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  Date de versement
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 shadow-sm"
                  value={dateSingle}
                  onChange={(e) => setDateSingle(ymd(e.target.value))}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  La facture portera sur le versement de cette date précise.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                    Date début
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 shadow-sm"
                    value={dateStart}
                    onChange={(e) => setDateStart(ymd(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                    Date fin
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 shadow-sm"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(ymd(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-700 mb-1">
                    Statut du paiement
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[13px] outline-none ring-2 ring-transparent focus:ring-sky-200 shadow-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="sold">Soldés</option>
                    <option value="nonsold">Non soldés</option>
                  </select>
                </div>
                <p className="sm:col-span-2 lg:col-span-3 mt-1 text-[11px] text-slate-500">
                  Tous les versements du passeport compris entre ces deux dates seront
                  listés. Utilise le filtre de statut pour ne voir que les soldés ou les
                  non soldés.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-dashed border-slate-200 mt-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-xs text-sky-700">
                  i
                </span>
                <span>
                  La recherche part automatiquement dès que le passeport et les dates sont
                  valides.
                </span>
              </div>
              {mode === "single" && (
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handlePrintOne(mainSelected)}
                    disabled={!mainSelected || loading}
                    className="inline-flex items-center gap-1 rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] font-semibold hover:brightness-110 disabled:opacity-60 shadow-sm"
                  >
                    <span>🖨️</span>
                    <span>Imprimer la facture</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Aperçu / Liste */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm min-h-[180px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-900">
                {mode === "single"
                  ? "Aperçu du versement"
                  : "Versements trouvés sur la période"}
              </h3>
              <p className="text-[12px] text-slate-500">
                {mode === "single"
                  ? "Données qui apparaîtront sur la facture."
                  : "Liste des versements filtrés par dates et statut."}
              </p>
            </div>
            <div className="text-[11px] text-slate-500">
              {results.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {results.length} résultat(s)
                </span>
              ) : loading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 border border-sky-100">
                  Recherche…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-slate-500 border border-slate-100">
                  Aucun résultat
                </span>
              )}
            </div>
          </div>

          {/* Mode une date : un seul versement affiché */}
          {mode === "single" ? (
            !mainSelected ? (
              <div className="flex h-[150px] items-center justify-center text-[13px] text-slate-500">
                <div className="text-center px-4">
                  <div className="mb-2 text-xl">{loading ? "⏳" : "🧭"}</div>
                  <p>
                    {loading
                      ? "Recherche du versement…"
                      : "Saisis un passeport et une date pour voir le détail."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
                <Preview label="Passeport" value={mainSelected.passeport} mono />
                <Preview label="Identifiant versement" value={mainSelected.id} mono />
                <Preview
                  label="Date de versement"
                  value={bestDate(mainSelected)}
                />
                <Preview label="Nom" value={mainSelected.nom} />
                <Preview label="Prénoms" value={mainSelected.prenoms} />
                <Preview
                  label="Statut"
                  value={mainSelected.statut || "—"}
                  badge={
                    mainSelected.statut
                      ? mainSelected.statut.toLowerCase().includes("sold")
                        ? "success"
                        : "warning"
                      : "default"
                  }
                />
                <Preview
                  label="Montant TTC"
                  value={`${fmt(mainSelected.total)} FCFA`}
                  mono
                  strong
                />
                <Preview
                  label="Montant du versement"
                  value={`${fmt(mainSelected.verse)} FCFA`}
                  mono
                />
                <Preview
                  label="Reste du paiement"
                  value={`${fmt(mainSelected.restant)} FCFA`}
                  mono
                />
              </div>
            )
          ) : // Mode intervalle : liste
          results.length === 0 ? (
            <div className="flex h-[150px] items-center justify-center text-[13px] text-slate-500">
              <div className="text-center px-4">
                <div className="mb-2 text-xl">{loading ? "⏳" : "📅"}</div>
                <p>
                  {loading
                    ? "Recherche des versements sur la période…"
                    : "Aucun versement trouvé pour cet intervalle et ce statut."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      #
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Date
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Identifiant
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Montant
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Versé
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Reste
                    </th>
                    <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">
                      Statut
                    </th>
                    <th className="px-2 py-1.5 text-right text-slate-500 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .slice()
                    .sort((a, b) => (bestDate(a) > bestDate(b) ? 1 : -1))
                    .map((v, idx) => {
                      const st = (v.statut || "").toLowerCase();
                      const sold = st.includes("sold");
                      return (
                        <tr
                          key={v.id || idx}
                          className="border-t border-slate-100 hover:bg-slate-50/60"
                        >
                          <td className="px-2 py-1.5 text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            {bestDate(v) || "—"}
                          </td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">
                            {v.id}
                          </td>
                          <td className="px-2 py-1.5 font-mono">
                            {fmt(v.total)} FCFA
                          </td>
                          <td className="px-2 py-1.5 font-mono text-emerald-700">
                            {fmt(v.verse)} FCFA
                          </td>
                          <td className="px-2 py-1.5 font-mono text-amber-700">
                            {fmt(v.restant)} FCFA
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className={
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                                (sold
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100")
                              }
                            >
                              {v.statut || (sold ? "Soldé" : "Non soldé")}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => handlePrintOne(v)}
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 text-white px-2.5 py-1 text-[12px] font-semibold hover:brightness-110 shadow-sm"
                            >
                              🖨️ Imprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Mini composants */
function Preview({ label, value, mono, strong, badge = "none" }) {
  const baseText =
    mono && !badge
      ? "font-mono font-semibold text-slate-900"
      : "font-semibold text-slate-900";

  const badgeNode =
    badge === "success" ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100 uppercase tracking-wide">
        OK
      </span>
    ) : badge === "warning" ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100 uppercase tracking-wide">
        À suivre
      </span>
    ) : badge === "default" ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-100 uppercase tracking-wide">
        Info
      </span>
    ) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
      <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div className="flex items-center">
        <div className={baseText}>
          {strong ? <strong>{value || "—"}</strong> : value || "—"}
        </div>
        {badgeNode}
      </div>
    </div>
  );
}
