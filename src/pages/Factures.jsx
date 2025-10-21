// src/pages/Factures.jsx
import React, { useMemo, useState } from "react";
import { getPayments } from "../pages/utils/paymentsStore";

/* Utils */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("fr-FR");

/** Données fallback si le store est vide (démo) */
const FALLBACK = [
  {
    id: "PMT-0001",
    ref: "PMT-0001",
    passeport: "23AP09976",
    nom: "ABDOULAYE",
    prenoms: "DOUKOURE",
    date: "2025-10-21",
    totalDu: 5_350_000,
    reduction: 0,
    montant: 2_000_000,
    statut: "Partiel",
    idPelerin: 12,
    idFacture: "FAC-2025-0101",
    nombrePaiements: 1,
    resteApres: 3_350_000,
  },
  {
    id: "PMT-0002",
    ref: "PMT-0002",
    passeport: "23AP09976",
    nom: "ABDOULAYE",
    prenoms: "DOUKOURE",
    date: "2025-10-22",
    totalDu: 5_350_000,
    reduction: 0,
    montant: 3_350_000,
    statut: "Complet",
    idPelerin: 12,
    idFacture: "FAC-2025-0102",
    nombrePaiements: 2,
    resteApres: 0,
  },
];

export default function Factures() {
  const today = new Date().toISOString().slice(0, 10);

  // 🔎 Filtres “live” (appliqués automatiquement)
  const [passeport, setPasseport] = useState("");
  const [du, setDu] = useState(today);
  const [au, setAu] = useState(today);

  /* Source : store → normalisation */
  const all = useMemo(() => {
    const list = getPayments();
    if (Array.isArray(list) && list.length > 0) {
      return list.map((p, idx) => ({
        id: p.id || `PMT-${idx + 1}`,
        ref: p.ref || `PMT-${idx + 1}`,
        passeport: p.passeport,
        nom: p.nom,
        prenoms: p.prenoms,
        date: (p.date || "").slice(0, 10),
        totalDu: Number(p.totalDu || 0),
        reduction: Number(p.reduction || 0),
        montant: Number(p.montant || 0),
        statut: p.statut || "Partiel",
        idPelerin: p.idPelerin || idx + 100,
        idFacture:
          p.idFacture ||
          `FAC-${new Date(p.date || Date.now()).getFullYear()}-${String(
            idx + 1
          ).padStart(4, "0")}`,
        nombrePaiements: p.nombrePaiements || 1,
        resteApres:
          p.resteApres ??
          Math.max(Number(p.totalDu || 0) - Number(p.montant || 0), 0),
      }));
    }
    return FALLBACK;
  }, []);

  /* Filtre “live” : passeport + intervalle de dates (inclusif) */
  const filtered = useMemo(() => {
    const s = (passeport || "").trim().toLowerCase();
    const d1 = du || "";
    const d2 = au || "";
    return all.filter((r) => {
      const okPass = !s || (r.passeport || "").toLowerCase().includes(s);
      const d = (r.date || "").slice(0, 10);
      const okDu = !d1 || d >= d1;
      const okAu = !d2 || d <= d2;
      return okPass && okDu && okAu;
    });
  }, [all, passeport, du, au]);

  const totals = useMemo(() => {
    const ttc = filtered.reduce((s, r) => s + Number(r.totalDu || 0), 0);
    const red = filtered.reduce((s, r) => s + Number(r.reduction || 0), 0);
    const pay = filtered.reduce((s, r) => s + Number(r.montant || 0), 0);
    const reste = filtered.reduce((s, r) => s + Number(r.resteApres ?? 0), 0);
    return { ttc, red, pay, reste };
  }, [filtered]);

  /* Actions UI */
  const onClear = () => {
    const t = new Date().toISOString().slice(0, 10);
    setPasseport("");
    setDu(t);
    setAu(t);
  };
  const onPrint = () => window.print();

  /* Export CSV */
  const exportCSV = () => {
    const headers = [
      "Identifiant de paiement",
      "ID Pèlerins",
      "ID Facture",
      "Date paiement",
      "Montant TTC",
      "Réduction paiement",
      "Montant paiement",
      "Montant payé",
      "Reste du paiement",
      "Nombre paiement",
      "Numéro passeport du pèlerin",
    ];
    const rows = filtered.map((r) => [
      r.ref || r.id,
      r.idPelerin,
      r.idFacture,
      r.date,
      r.totalDu,
      r.reduction,
      r.montant,
      r.montant,
      r.resteApres ?? 0,
      r.nombrePaiements ?? 1,
      r.passeport,
    ]);
    const csv =
      [headers, ...rows]
        .map((arr) =>
          arr
            .map((v) =>
              typeof v === "string"
                ? `"${v.replaceAll('"', '""')}"`
                : String(v)
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

  /* Export PDF (mini-rapport imprimable) */
  const exportPDF = () => {
    const pop = window.open("", "_blank", "width=1200,height=800");
    if (!pop) return;
    const style = `
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;color:#0b1220}
      h1{font-size:20px;margin:0 0 4px 0;font-weight:900}
      .muted{color:#334155;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      thead th{background:#eef2ff;text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb}
      td{padding:6px 10px;border-bottom:1px solid #e5e7eb}
      .tot{margin-top:12px;font-size:12px}
      @page{size:A4;margin:10mm}
    `;
    const headers = [
      "Identifiant",
      "ID Pèlerin",
      "ID Facture",
      "Date",
      "TTC",
      "Réduction",
      "Montant",
      "Payé",
      "Reste",
      "Nb paiements",
      "Passeport",
    ];
    const rows = filtered
      .map(
        (r) => `
      <tr>
        <td>${r.ref || r.id}</td>
        <td>${r.idPelerin}</td>
        <td>${r.idFacture}</td>
        <td>${r.date}</td>
        <td>${fmt(r.totalDu)} FCFA</td>
        <td>${fmt(r.reduction)} FCFA</td>
        <td>${fmt(r.montant)} FCFA</td>
        <td>${fmt(r.montant)} FCFA</td>
        <td>${fmt(r.resteApres ?? 0)} FCFA</td>
        <td>${r.nombrePaiements ?? 1}</td>
        <td>${r.passeport}</td>
      </tr>`
      )
      .join("");
    pop.document.write(`
      <html><head><title>Factures</title><style>${style}</style></head>
      <body>
        <h1>Rapport des paiements — Factures</h1>
        <div class="muted">Passeport: ${passeport || "—"} • Période: ${du || "—"} → ${au || "—"}</div>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows || `<tr><td colspan="11">Aucun résultat</td></tr>`}</tbody>
        </table>
        <div class="tot"><strong>Totaux :</strong>
          TTC ${fmt(totals.ttc)} FCFA • Réductions ${fmt(totals.red)} FCFA • Payé ${fmt(totals.pay)} FCFA • Reste ${fmt(totals.reste)} FCFA
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    pop.document.close();
  };

  return (
    <div className="text-white">
      <style>{`
        :root{
          --bg:#07181f; --panel:#0b1721; --muted:#9fb3b7; --border:#163142;
        }
        .fx-page{min-height:100dvh;
          background:
            radial-gradient(1100px 600px at -10% -20%, #0f3f44 0%, transparent 60%),
            radial-gradient(1000px 500px at 120% 0%, #0b3f2f 0%, transparent 60%),
            var(--bg);
          padding:22px;}
        .fx-shell{max-width:1280px;margin:0 auto;
          background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
          border:1px solid var(--border); border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.35); overflow:hidden;}
        .fx-header{padding:18px 16px;background:linear-gradient(135deg,#ffbc54 0%, #ff8f33 100%);color:#13232c;}
        .fx-title{font-size:20px;font-weight:900;letter-spacing:.3px}
        .fx-sub{font-size:13px}
        .fx-controls{display:flex; gap:10px; align-items:center; flex-wrap:wrap;
          padding:14px 16px; background:var(--panel); border-bottom:1px solid var(--border);}
        .input{background:#0a1620;border:1px solid var(--border);color:#fff;padding:10px 12px;border-radius:10px;outline:none}
        .btn{background:#0a1620;border:1px solid var(--border);color:#fff;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer}
        .btn:hover{border-color:#335a6e}
        .btn.csv{background:linear-gradient(135deg,#f59e0b,#d97706);border-color:transparent}
        .btn.pdf{background:linear-gradient(135deg,#a78bfa,#7c3aed);border-color:transparent}
        .btn.print{background:linear-gradient(135deg,#60a5fa,#2563eb);border-color:transparent}
        .tbl{width:100%;border-collapse:separate;border-spacing:0 8px}
        thead th{padding:10px 12px;text-align:left;font-size:12px;letter-spacing:.4px;color:var(--muted);text-transform:uppercase}
        .row{background:#0b1f25;border:1px solid var(--border);border-radius:12px}
        .row td{padding:12px}
        .mono{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace}
        .sum{display:flex;gap:12px;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--border);background:var(--panel)}
        .pill{background:#0b1f25;border:1px solid var(--border);border-radius:999px;padding:6px 10px;font-weight:800}
        @media print{
          body{background:white}
          body *{visibility:hidden}
          .print-area, .print-area *{visibility:visible}
          .print-area{position:absolute; inset:0; margin:0; padding:0}
          @page{size:A4;margin:10mm}
        }
      `}</style>

      <div className="fx-page">
        <div className="fx-shell">
          <div className="fx-header">
            <div className="flex items-center justify-between">
              <div>
                <div className="fx-title">Factures & Paiements</div>
                <div className="fx-sub">
                  Recherche <b>automatique</b> par passeport • Période <b>DU → AU</b> • Export CSV • Export PDF • Impression
                </div>
              </div>
              <div className="chip">📄 <strong>{filtered.length}</strong> enregistrements</div>
            </div>
          </div>

          {/* Filtres automatiques (pas de bouton Rechercher) */}
          <div className="fx-controls">
            <label className="text-sm text-slate-300">Passeport</label>
            <input
              className="input mono"
              placeholder="ex: 23AP09976"
              value={passeport}
              onChange={(e) => setPasseport(e.target.value)}
            />

            <label className="text-sm text-slate-300" style={{ marginLeft: 8 }}>
              Du
            </label>
            <input type="date" className="input" value={du} onChange={(e) => setDu(e.target.value)} />

            <label className="text-sm text-slate-300">Au</label>
            <input type="date" className="input" value={au} onChange={(e) => setAu(e.target.value)} />

            <button type="button" onClick={onClear} className="btn">Effacer</button>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button type="button" onClick={exportCSV} className="btn csv">Exporter CSV</button>
              <button type="button" onClick={exportPDF} className="btn pdf">Exporter PDF</button>
              <button type="button" onClick={onPrint} className="btn print">Imprimer 🖨️</button>
            </div>
          </div>

          {/* Tableau */}
          <div className="px-3 pb-3 overflow-x-auto" style={{ background: "var(--panel)" }}>
            <table className="tbl min-w-[1200px]">
              <thead>
                <tr>
                  <Th>Identifiant de Paiement</Th>
                  <Th>ID Pèlerins</Th>
                  <Th>ID Facture</Th>
                  <Th>Date paiement</Th>
                  <Th>Montant TTC</Th>
                  <Th>Réduction</Th>
                  <Th>Montant paiement</Th>
                  <Th>Montant payé</Th>
                  <Th>Reste</Th>
                  <Th>Nombre paiement</Th>
                  <Th>Passeport</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="row">
                    <Td className="mono">{r.ref || r.id}</Td>
                    <Td>{r.idPelerin}</Td>
                    <Td className="mono">{r.idFacture}</Td>
                    <Td>{r.date}</Td>
                    <Td className="mono">{fmt(r.totalDu)} FCFA</Td>
                    <Td className="mono">{fmt(r.reduction)} FCFA</Td>
                    <Td className="mono">{fmt(r.montant)} FCFA</Td>
                    <Td className="mono">{fmt(r.montant)} FCFA</Td>
                    <Td className="mono">{fmt(r.resteApres ?? 0)} FCFA</Td>
                    <Td>{r.nombrePaiements ?? 1}</Td>
                    <Td className="mono">{r.passeport}</Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="row">
                    <Td colSpan={11} className="text-center text-slate-400">Aucun résultat</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="sum">
            <div className="pill">TTC : {fmt(totals.ttc)} FCFA</div>
            <div className="pill">Réductions : {fmt(totals.red)} FCFA</div>
            <div className="pill">Payé : {fmt(totals.pay)} FCFA</div>
            <div className="pill">Reste : {fmt(totals.reste)} FCFA</div>
          </div>
        </div>

        {/* Zone imprimable */}
        <div className="print-area">
          <div style={{ padding: 24, color: "#111", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial" }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Rapport des paiements — Factures</h1>
            <div style={{ fontSize: 12, color: "#374151" }}>
              Passeport: {passeport || "—"} • Période: {du || "—"} → {au || "—"}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {[
                    "Identifiant",
                    "ID Pèlerin",
                    "ID Facture",
                    "Date",
                    "TTC",
                    "Réduction",
                    "Montant",
                    "Payé",
                    "Reste",
                    "Nb paiements",
                    "Passeport",
                  ].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e5e7eb" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`print-${r.id}`}>
                    <td style={tdp}>{r.ref || r.id}</td>
                    <td style={tdp}>{r.idPelerin}</td>
                    <td style={tdp}>{r.idFacture}</td>
                    <td style={tdp}>{r.date}</td>
                    <td style={tdp}>{fmt(r.totalDu)} FCFA</td>
                    <td style={tdp}>{fmt(r.reduction)} FCFA</td>
                    <td style={tdp}>{fmt(r.montant)} FCFA</td>
                    <td style={tdp}>{fmt(r.montant)} FCFA</td>
                    <td style={tdp}>{fmt(r.resteApres ?? 0)} FCFA</td>
                    <td style={tdp}>{r.nombrePaiements ?? 1}</td>
                    <td style={tdp}>{r.passeport}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td style={tdp} colSpan={11}>Aucun résultat</td></tr>
                )}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <strong>Totaux :</strong> TTC {fmt(totals.ttc)} FCFA • Réductions {fmt(totals.red)} FCFA • Payé {fmt(totals.pay)} FCFA • Reste {fmt(totals.reste)} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mini composants */
function Th({ children }) {
  return <th className="text-left">{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`align-middle ${className}`}>
      {children}
    </td>
  );
}
const tdp = { padding: "6px 10px", borderBottom: "1px solid #e5e7eb" };
