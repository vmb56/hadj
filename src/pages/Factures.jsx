// src/pages/Factures.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ===========================================================
   🔗 Connexion API backend (même logique que RecherchePaiement)
   =========================================================== */
function getApiBase() {
  let viteUrl;
  try { viteUrl = typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL; } catch {}
  const craUrl =
    typeof process !== "undefined" &&
    process?.env &&
    (process.env.REACT_APP_API_URL || process.env.API_URL);
  const winUrl =
    typeof window !== "undefined" && typeof window.__API_URL__ !== "undefined"
      ? window.__API_URL__
      : undefined;

  let u = viteUrl || craUrl || winUrl || "";
  if (typeof u !== "string") u = String(u ?? "");
  return u.replace(/\/+$/, "");
}
const API_BASE = getApiBase();
const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
async function http(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    credentials: "include",
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
  return data;
}
async function apiGetPaiements() {
  const data = await http(`${API_BASE}/api/paiements`);
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map(normalizePayment);
}

/* ========================= Normalisation ========================= */
function normalizePayment(r = {}) {
  return {
    id: r.id,
    ref: r.ref || r.id,
    passeport: r.passeport ?? "",
    nom: r.nom ?? "",
    prenoms: r.prenoms ?? "",
    mode: r.mode ?? "",
    montant: Number(r.montant ?? r.montant_paye ?? 0),
    totalDu: Number(r.totalDu ?? r.total_du ?? 0),
    reduction: Number(r.reduction ?? 0),
    date: r.date ?? r.date_paiement ?? "",
    statut: r.statut ?? "",
  };
}

/* ========================= Helpers UI/Date ========================= */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n)) ? "0" : Number(n).toLocaleString("fr-FR");
const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = toISO(new Date());
const startOfMonthISO = toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const addDaysISO = (baseISO, n) =>
  toISO(new Date(new Date(baseISO).getTime() + n * 86400000));

/* ========================= Styles boutons ========================= */
const BTN_BASE =
  "rounded-xl px-3 py-2 text-[13.5px] font-medium border border-slate-300 hover:brightness-110";
const BTN_MINI = `${BTN_BASE} bg-white hover:bg-slate-50`;
const BTN_AMBER = `${BTN_BASE} bg-amber-600 text-white`;
const BTN_SKY = `${BTN_BASE} bg-sky-600 text-white`;
const BTN_INDIGO = `${BTN_BASE} bg-indigo-600 text-white`;

/* =========================== Page =========================== */
export default function Factures() {
  const [passeport, setPasseport] = useState("");
  const [du, setDu] = useState(todayISO);
  const [au, setAu] = useState(todayISO);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const setRange = (kind) => {
    if (kind === "today") {
      setDu(todayISO); setAu(todayISO);
    } else if (kind === "last7") {
      setDu(addDaysISO(todayISO, -6)); setAu(todayISO);
    } else if (kind === "thisMonth") {
      setDu(startOfMonthISO); setAu(todayISO);
    }
  };

  // 📡 Chargement via API
  const reload = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await apiGetPaiements(); // normalisés
      setRows(data);
    } catch (e) {
      setErr(e.message || "Erreur de chargement des paiements");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  // 🧮 Map des sommes par passeport pour calculer le reste (par dossier)
  const paiementAgg = useMemo(() => {
    const byPass = new Map();
    for (const r of rows) {
      const k = r.passeport || "";
      const prev = byPass.get(k) || { paid: 0, maxTotalDu: 0 };
      prev.paid += Number(r.montant || 0);
      prev.maxTotalDu = Math.max(prev.maxTotalDu, Number(r.totalDu || 0));
      byPass.set(k, prev);
    }
    return byPass; // Map(passeport -> {paid, maxTotalDu})
  }, [rows]);

  // 🔍 Filtres + enrichissement "reste"
  const filtered = useMemo(() => {
    const s = (passeport || "").trim().toLowerCase();
    return rows
      .map((r) => {
        const agg = paiementAgg.get(r.passeport || "") || { paid: 0, maxTotalDu: 0 };
        const reste = Math.max(agg.maxTotalDu - agg.paid, 0);
        return { ...r, resteApres: reste };
      })
      .filter((r) => {
        const okPass = !s || (r.passeport || "").toLowerCase().includes(s);
        const d = (r.date || "").slice(0, 10);
        const okDu = !du || d >= du;
        const okAu = !au || d <= au;
        return okPass && okDu && okAu;
      });
  }, [rows, passeport, du, au, paiementAgg]);

  // 🧾 Totaux sur l’échantillon filtré
  const totals = useMemo(() => {
    const ttc = filtered.reduce((s, r) => s + Number(r.totalDu || 0), 0);
    const red = filtered.reduce((s, r) => s + Number(r.reduction || 0), 0);
    const pay = filtered.reduce((s, r) => s + Number(r.montant || 0), 0);
    const reste = filtered.reduce((s, r) => s + Math.max(Number(r.resteApres || 0), 0), 0);
    return { ttc, red, pay, reste };
  }, [filtered]);

  const onClear = () => { setPasseport(""); setRange("today"); };
  const onPrint = () => window.print();

  /* ----------- Export CSV ----------- */
  const exportCSV = () => {
    const headers = [
      "Identifiant paiement",
      "ID Facture",
      "Date",
      "Montant TTC",
      "Réduction",
      "Montant payé",
      "Reste",
      "Passeport",
    ];
    const rowsCSV = filtered.map((r) => [
      r.ref || r.id,
      r.idFacture || "",
      r.date,
      r.totalDu,
      r.reduction,
      r.montant,
      r.resteApres ?? 0,
      r.passeport,
    ]);
    const csv =
      [headers, ...rowsCSV]
        .map((arr) =>
          arr
            .map((v) =>
              typeof v === "string" ? `"${v.replaceAll('"', '""')}"` : String(v ?? "")
            )
            .join(";")
        )
        .join("\n") + "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `factures_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ----------- Export PDF (impression) ----------- */
  const exportPDF = () => {
    const pop = window.open("", "_blank", "width=1200,height=800");
    if (!pop) return;
    const style = `
      body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:24px;color:#0b1220}
      h1{font-size:20px;margin:0 0 4px 0;font-weight:900}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      th{background:#f3f4f6;text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb}
      td{padding:6px 10px;border-bottom:1px solid #e5e7eb}
      @page{size:A4;margin:10mm}
    `;
    const rowsHTML =
      filtered
        .map(
          (r) => `
        <tr>
          <td>${r.ref || r.id}</td>
          <td>${r.idFacture || ""}</td>
          <td>${r.date}</td>
          <td>${fmt(r.totalDu)} FCFA</td>
          <td>${fmt(r.reduction)} FCFA</td>
          <td>${fmt(r.montant)} FCFA</td>
          <td>${fmt(r.resteApres ?? 0)} FCFA</td>
          <td>${r.passeport}</td>
        </tr>`
        )
        .join("") || "<tr><td colspan='8'>Aucun résultat</td></tr>";

    pop.document.write(`
      <html><head><title>Factures</title><style>${style}</style></head>
      <body>
        <h1>Rapport des paiements — Factures</h1>
        <div>Passeport: ${passeport || "—"} • Période: ${du} → ${au}</div>
        <table>
          <thead>
            <tr>
              <th>Identifiant</th><th>ID Facture</th><th>Date</th>
              <th>TTC</th><th>Réduction</th><th>Payé</th><th>Reste</th><th>Passeport</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
        <div style="margin-top:10px">
          <strong>Totaux :</strong>
          TTC ${fmt(totals.ttc)} FCFA • Réduction ${fmt(totals.red)} FCFA •
          Payé ${fmt(totals.pay)} FCFA • Reste ${fmt(totals.reste)} FCFA
        </div>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    pop.document.close();
  };

  return (
    <div className="space-y-6 text-dyn">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Factures & Paiements</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Recherche par passeport & période · Export CSV/PDF · Impression.
        </p>
        {loading && <p className="text-sm text-slate-500">Chargement…</p>}
        {err && <p className="text-sm text-rose-600">{err}</p>}
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="w-56 rounded-xl border border-slate-300 px-3 py-2 text-[14px] outline-none font-mono"
            placeholder="Passeport"
            value={passeport}
            onChange={(e) => setPasseport(e.target.value)}
          />
          <input
            type="date"
            value={du}
            onChange={(e) => setDu(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-[14px]"
          />
          <input
            type="date"
            value={au}
            onChange={(e) => setAu(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-[14px]"
          />

          <button onClick={() => setRange("today")} className={BTN_MINI}>Aujourd’hui</button>
          <button onClick={() => setRange("last7")} className={BTN_MINI}>7 derniers jours</button>
          <button onClick={() => setRange("thisMonth")} className={BTN_MINI}>Mois en cours</button>
          <button onClick={onClear} className={BTN_MINI}>Effacer</button>

          <div className="sm:ml-auto flex gap-2">
            <button onClick={exportCSV} className={BTN_AMBER}>Export CSV</button>
            <button onClick={exportPDF} className={BTN_INDIGO}>Export PDF</button>
            <button onClick={onPrint} className={BTN_SKY}>Imprimer 🖨️</button>
          </div>
        </div>

        <div className="mt-2 text-[12.5px] text-slate-600">
          {filtered.length} enregistrement(s) — TTC{" "}
          <span className="font-semibold text-slate-900">{fmt(totals.ttc)} FCFA</span>{" "}
          • Réduction {fmt(totals.red)} FCFA • Payé {fmt(totals.pay)} FCFA • Reste{" "}
          {fmt(totals.reste)} FCFA
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] text-[14.5px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase text-[12.5px]">
                <Th>Identifiant</Th>
                <Th>ID Facture</Th>
                <Th>Date</Th>
                <Th>Montant TTC</Th>
                <Th>Réduction</Th>
                <Th>Payé</Th>
                <Th>Reste</Th>
                <Th>Passeport</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.id}-${r.ref}`} className="border-t border-slate-200 hover:bg-slate-50">
                  <Td>{r.ref || r.id}</Td>
                  <Td>{r.idFacture || "—"}</Td>
                  <Td>{r.date}</Td>
                  <Td>{fmt(r.totalDu)} FCFA</Td>
                  <Td>{fmt(r.reduction)} FCFA</Td>
                  <Td>{fmt(r.montant)} FCFA</Td>
                  <Td>{fmt(r.resteApres ?? 0)} FCFA</Td>
                  <Td>{r.passeport}</Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <Td colSpan={8} className="text-center text-slate-500 py-6">Aucun résultat</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Mini composants */
function Th({ children }) {
  return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, colSpan, className = "" }) {
  return <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>;
}
