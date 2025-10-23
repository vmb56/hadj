// src/pages/Factures.jsx
import React, { useMemo, useState } from "react";
import { getPayments } from "../pages/utils/paymentsStore"; // ✅ chemin corrigé

/* Utils */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("fr-FR");

const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = toISO(new Date());
const startOfMonthISO = toISO(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
);
const addDaysISO = (baseISO, n) =>
  toISO(new Date(new Date(baseISO).getTime() + n * 86400000));

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
  // 🔎 Filtres live
  const [passeport, setPasseport] = useState("");
  const [du, setDu] = useState(todayISO);
  const [au, setAu] = useState(todayISO);

  // Raccourcis de période
  const setRange = (kind) => {
    if (kind === "today") {
      setDu(todayISO);
      setAu(todayISO);
    } else if (kind === "last7") {
      setDu(addDaysISO(todayISO, -6)); // 7 jours inclus
      setAu(todayISO);
    } else if (kind === "thisMonth") {
      setDu(startOfMonthISO);
      setAu(todayISO);
    }
  };

  /* Source */
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

  /* Filtre live */
  const filtered = useMemo(() => {
    const s = (passeport || "").trim().toLowerCase();
    return all.filter((r) => {
      const okPass = !s || (r.passeport || "").toLowerCase().includes(s);
      const d = (r.date || "").slice(0, 10);
      const okDu = !du || d >= du;
      const okAu = !au || d <= au;
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

  const onClear = () => {
    setPasseport("");
    setRange("today");
  };

  const onPrint = () => window.print();

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
              typeof v === "string" ? `"${v.replaceAll('"', '""')}"` : String(v)
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

  const exportPDF = () => {
    const pop = window.open("", "_blank", "width=1200,height=800");
    if (!pop) return;
    const style = `
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;color:#0b1220}
      h1{font-size:20px;margin:0 0 4px 0;font-weight:900}
      .muted{color:#334155;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      thead th{background:#f3f4f6;text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb}
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
    <div className="space-y-6 text-dyn">
      {/* styles print uniquement */}
      <style>{`
        @media print{
          body{background:white}
          body *{visibility:hidden}
          .print-area, .print-area *{visibility:visible}
          .print-area{position:absolute; inset:0; margin:0; padding:0}
          @page{size:A4;margin:10mm}
        }
      `}</style>

      {/* En-tête (aligné Medicale) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">
          Factures & Paiements
        </h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Recherche par passeport & période · Export CSV/PDF · Impression.
        </p>
      </div>

      {/* Contrôles / filtres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Passeport</span>
            <input
              className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 font-mono"
              placeholder="ex: 23AP09976"
              value={passeport}
              onChange={(e) => setPasseport(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Du</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200"
              value={du}
              onChange={(e) => setDu(e.target.value)}
            />
            <span className="text-[13.5px] text-slate-600">Au</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200"
              value={au}
              onChange={(e) => setAu(e.target.value)}
            />
          </div>

          {/* Raccourcis */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRange("today")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[13.5px] hover:bg-slate-100"
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              onClick={() => setRange("last7")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[13.5px] hover:bg-slate-100"
            >
              7 derniers jours
            </button>
            <button
              type="button"
              onClick={() => setRange("thisMonth")}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[13.5px] hover:bg-slate-100"
            >
              Mois en cours
            </button>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="sm:ml-auto rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50"
          >
            Effacer
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-xl bg-amber-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
            >
              Exporter CSV
            </button>
            <button
              type="button"
              onClick={exportPDF}
              className="rounded-xl bg-indigo-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
            >
              Exporter PDF
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
            >
              Imprimer 🖨️
            </button>
          </div>
        </div>

        {/* Compteur / totaux mini */}
        <div className="mt-3 text-[12.5px] text-slate-600">
          {filtered.length} enregistrement(s) —{" "}
          <span className="font-semibold text-slate-900">
            TTC {fmt(totals.ttc)} FCFA
          </span>{" "}
          • Réductions {fmt(totals.red)} FCFA • Payé{" "}
          {fmt(totals.pay)} FCFA • Reste {fmt(totals.reste)} FCFA
        </div>
      </div>

      {/* Tableau (clair, lisible) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] text-[14.5px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase tracking-wide text-[12.5px]">
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
            <tbody className="[&_tr]:border-t [&_tr]:border-slate-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <Td className="font-mono text-slate-900">{r.ref || r.id}</Td>
                  <Td className="text-slate-800">{r.idPelerin}</Td>
                  <Td className="font-mono text-slate-800">{r.idFacture}</Td>
                  <Td className="text-slate-700">{r.date}</Td>
                  <Td className="font-mono text-slate-900">{fmt(r.totalDu)} FCFA</Td>
                  <Td className="font-mono text-slate-800">{fmt(r.reduction)} FCFA</Td>
                  <Td className="font-mono text-slate-800">{fmt(r.montant)} FCFA</Td>
                  <Td className="font-mono text-slate-800">{fmt(r.montant)} FCFA</Td>
                  <Td className="font-mono text-slate-800">
                    {fmt(r.resteApres ?? 0)} FCFA
                  </Td>
                  <Td className="text-slate-800">{r.nombrePaiements ?? 1}</Td>
                  <Td className="font-mono text-slate-900">{r.passeport}</Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <Td colSpan={11} className="text-center text-slate-500 py-6">
                    Aucun résultat
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone imprimable (clair forcé) */}
      <div className="print-area">
        <div
          style={{
            padding: 24,
            color: "#111",
            fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
            Rapport des paiements — Factures
          </h1>
          <div style={{ fontSize: 12, color: "#374151" }}>
            Passeport: {passeport || "—"} • Période: {du || "—"} → {au || "—"}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 12,
              fontSize: 12,
            }}
          >
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
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
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
                <tr>
                  <td style={tdp} colSpan={11}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            <strong>Totaux :</strong> TTC {fmt(totals.ttc)} FCFA • Réductions{" "}
            {fmt(totals.red)} FCFA • Payé {fmt(totals.pay)} FCFA • Reste{" "}
            {fmt(totals.reste)} FCFA
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mini composants */
function Th({ children }) {
  return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}
const tdp = { padding: "6px 10px", borderBottom: "1px solid #e5e7eb" };
