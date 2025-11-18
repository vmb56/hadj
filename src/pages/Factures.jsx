// src/pages/Factures.jsx
import React, { useMemo, useState } from "react";
import Logo from "../../src/pages/pelerins/Logo.png";
/* ========= Config API (CRA OK) ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ========= Utils ========= */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n)) ? "0" : Number(n).toLocaleString("fr-FR");

const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = toISO(new Date());

function ymd(x) {
  // normalise en YYYY-MM-DD
  if (!x) return "";
  if (/^\d{8}$/.test(x)) {
    // 20250605 -> 2025-06-05
    return `${x.slice(0,4)}-${x.slice(4,6)}-${x.slice(6,8)}`;
  }
  const s = String(x).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(x);
  return isNaN(d) ? "" : toISO(d);
}

function yyyymmdd(x) {
  const s = ymd(x);
  return s ? s.replace(/-/g, "") : "";
}

/* ========= Normalisation d’un versement =========
   Backend /api/paiements/versements expose:
   { id, passeport, nom, prenoms, echeance, verse, restant, statut, createdAt, updatedAt }
*/
function normalizeVersement(row = {}, idx = 0) {
  const id = row.id ?? `VRS-${idx + 1}`;
  const passeport = row.passeport ?? row.passport ?? "";
  const nom = row.nom ?? "";
  const prenoms = row.prenoms ?? "";
  const verse = Number(row.verse ?? 0);
  const restant = Number(row.restant ?? 0);
  const total = Number(row.total ?? row.totalDu ?? row.total_du ?? verse + restant);
  const dateVersement =
    ymd(row.echeance) || ymd(row.createdAt) || ymd(row.updatedAt) || "";

  return {
    id,
    passeport,
    nom,
    prenoms,
    verse,
    restant,
    total,
    statut: row.statut ?? "",
    dateVersement,           // YYYY-MM-DD
    dateVersementRaw: row.echeance ?? row.createdAt ?? row.updatedAt ?? "",
  };
}

/* ========= Impression HTML (2 exemplaires sur A4) ========= */
function openPrintWindow(v, { logoUrl, watermarkText }) {
  const style = `
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:18px;color:#0b1220}
    .sheet{width:210mm;margin:0 auto;box-sizing:border-box}
    .facture{position:relative;border:1px solid #e5e7eb;border-radius:6px;padding:16mm;margin-bottom:14mm;min-height:128mm}
    .entete{display:flex;align-items:flex-start;justify-content:space-between}
    .brand{display:flex;align-items:center;gap:10px}
    .brand img{width:52px;height:52px;object-fit:contain}
    .title{font-size:20px;font-weight:900;letter-spacing:.5px;color:#b91c1c;text-align:center;margin:6px 0 12px}
    .meta{font-size:12px;color:#111;text-align:right;line-height:1.35}
    .grid{margin-top:6mm;display:grid;grid-template-columns: 1.4fr 1fr 1fr;gap:8px 22px;font-size:13px}
    .lbl{color:#111;font-weight:700}
    .val{color:#111}
    .money{font-family:ui-monospace, SFMono-Regular, Menlo, monospace}
    .signs{display:flex;justify-content:space-between;margin-top:12mm;font-size:13px}
    .sig{width:45%;border-top:1px solid #111;padding-top:3mm;text-align:center}
    .wm{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-8deg);
        font-weight:900;font-size:120px;color: rgba(255,153,0,0.15);letter-spacing: 2px;user-select:none;pointer-events:none}
    @page{size:A4;margin:10mm}
  `;

  const now = new Date();
  const nowDate = now.toLocaleDateString("fr-FR");
  const nowTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const bloc = (copyLabel) => `
    <div class="facture" role="document" aria-label="Facture versement">
      <div class="wm">${watermarkText || "BMVT"}</div>

      <div class="entete">
        <div class="brand">
          <img src="${Logo}" alt="logo"/>
          <div>
            <div style="font-weight:900;color:#0b1220">BMVT</div>
            <div style="font-size:12px;color:#334155;margin-top:2px">Bénédiction MAWA Voyages &amp; Tourismes</div>
          </div>
        </div>
        <div class="meta">
          <div>${nowDate}</div>
          <div>${nowTime}</div>
        </div>
      </div>

      <div class="title">FACTURE VERSEMENT</div>

      <div class="grid">
        <div class="lbl">NUMÉRO DE PASSEPORT DU PÈLERIN :</div>
        <div class="val" style="grid-column: span 2">${v.passeport || "—"}</div>

        <div class="lbl">IDENTIFIANT DE VERSEMENTS :</div>
        <div class="val" style="grid-column: span 2">${v.id}</div>

        <div class="lbl">DATE VERSEMENT :</div>
        <div class="val" style="grid-column: span 2">${v.dateVersement || "—"}</div>

        <div class="lbl">NOM DU PÈLERIN :</div>
        <div class="val" style="grid-column: span 2">${v.nom || "—"}</div>

        <div class="lbl">PRÉNOMS DU PÈLERIN :</div>
        <div class="val" style="grid-column: span 2">${v.prenoms || "—"}</div>

        <div class="lbl">MONTANT TTC :</div>
        <div class="val money">${fmt(v.total)}&nbsp;FCFA</div>
        <div></div>

        <div class="lbl">MONTANT DU VERSEMENT :</div>
        <div class="val money">${fmt(v.verse)}&nbsp;FCFA</div>
        <div></div>

        <div class="lbl">RESTE DU PAIEMENT :</div>
        <div class="val money">${fmt(v.restant)}&nbsp;FCFA</div>
        <div></div>
      </div>

      <div class="signs">
        <div class="sig">SIGNATURE PÈLERINS</div>
        <div class="sig">SIGNATURE DE L'AGENT</div>
      </div>

      <div style="position:absolute;right:14mm;bottom:8mm;font-size:11px;color:#64748b;font-weight:700">${copyLabel}</div>
    </div>
  `;

  const html = `
    <html><head><title>Facture Versement</title><meta charset="utf-8"/>
    <style>${style}</style></head>
    <body>
      <div class="sheet">
        ${bloc("COPIE 1")}
        ${bloc("COPIE 2")}
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
  const [dateV, setDateV] = useState(todayISO);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [found, setFound] = useState(null);

  const canSearch = useMemo(() => (passport || "").trim().length >= 3, [passport]);

  async function fetchVersement(e) {
    if (e) e.preventDefault();
    setErr("");
    setFound(null);

    const pass = (passport || "").replace(/\s+/g, "").toUpperCase();
    const dateWanted = ymd(dateV);
    if (!pass) { setErr("Saisis un numéro de passeport."); return; }
    if (!dateWanted) { setErr("Choisis une date de versement."); return; }

    setLoading(true);
    try {
      const token = getToken();
      const base = API_BASE.replace(/\/+$/, "");
      const url = new URL(`${base}/api/paiements/versements`);
      url.searchParams.set("passeport", pass);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      const items = list.map(normalizeVersement);

      // Cherche sur la date (priorité echeance, sinon createdAt/updatedAt)
      const wanted = items.find(v =>
        ymd(v.dateVersement) === dateWanted ||
        ymd(v.dateVersementRaw) === dateWanted ||
        ymd(v.createdAt) === dateWanted ||
        ymd(v.updatedAt) === dateWanted
      );

      if (!wanted) {
        setErr("Aucun versement trouvé pour ce passeport à cette date.");
        setFound(null);
        return;
      }
      setFound(wanted);
    } catch (e2) {
      setErr(e2.message || "Échec de la recherche.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    if (!found) { alert("Aucun versement sélectionné."); return; }
    openPrintWindow(found, {
      // Remplace par ton logo si besoin
      logoUrl: "https://via.placeholder.com/90x90?text=BMVT",
      watermarkText: "BMVT",
    });
  }

  return (
    <div className="space-y-6 text-dyn">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Facture versement</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Imprimer la facture d’un versement par <strong>passeport</strong> et <strong>date</strong>.
        </p>
        {loading && <p className="text-sm text-slate-500">Recherche…</p>}
        {err && <p className="text-sm text-rose-600">{err}</p>}
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={fetchVersement}>
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Passeport</span>
            <input
              className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 font-mono"
              placeholder="ex: 23AP18311"
              value={passport}
              onChange={(e) => setPassport(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Date de versement</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200"
              value={dateV}
              onChange={(e) => setDateV(ymd(e.target.value))}
            />
          </div>

          <div className="sm:ml-auto flex gap-2">
            <button
              type="submit"
              disabled={!canSearch || loading}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50 disabled:opacity-60"
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!found}
              className="rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110 disabled:opacity-60"
            >
              Imprimer 🖨️
            </button>
          </div>
        </form>

        {/* Aperçu rapide (si trouvé) */}
        {found && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[14px]">
            <Preview label="Passeport" value={found.passeport} />
            <Preview label="Identifiant versement" value={found.id} mono />
            <Preview label="Date versement" value={found.dateVersement} />
            <Preview label="Nom" value={found.nom} />
            <Preview label="Prénoms" value={found.prenoms} />
            <Preview label="Statut" value={found.statut || "—"} />
            <Preview label="Montant TTC" value={`${fmt(found.total)} FCFA`} mono />
            <Preview label="Montant du versement" value={`${fmt(found.verse)} FCFA`} mono />
            <Preview label="Reste du paiement" value={`${fmt(found.restant)} FCFA`} mono />
          </div>
        )}
      </div>
    </div>
  );
}

/* Mini composants */
function Preview({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className={mono ? "font-mono font-semibold text-slate-900" : "font-semibold text-slate-900"}>
        {value || "—"}
      </div>
    </div>
  );
}
