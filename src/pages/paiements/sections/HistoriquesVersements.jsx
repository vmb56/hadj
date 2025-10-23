// src/pages/paiement/HistoriquesVersements.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getVersements } from "../../utils/paymentsStore";

export default function HistoriquesVersements() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(getVersements());
  }, []);

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
              {filtered.length} élément(s) • Versé :{" "}
              <span className="font-semibold text-slate-900">
                {totalVerse.toLocaleString("fr-FR")} FCFA
              </span>{" "}
              • Restant :{" "}
              <span className="font-semibold text-slate-900">
                {totalRestant.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (passeport, nom, statut...)"
            className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 placeholder:text-slate-400"
          />
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
                <tr key={x.id || i} className="hover:bg-slate-50/70 transition-colors">
                  <Td className="text-slate-600">{i + 1}</Td>
                  <Td className="font-mono text-slate-800">{x.passeport}</Td>
                  <Td className="text-slate-900">{x.nom} {x.prenoms}</Td>
                  <Td className="text-slate-600">{x.echeance}</Td>
                  <Td className="font-semibold text-slate-900">
                    {Number(x.verse || 0).toLocaleString("fr-FR")} FCFA
                  </Td>
                  <Td className="text-slate-800">
                    {Number(x.restant || 0).toLocaleString("fr-FR")} FCFA
                  </Td>
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
  return (
    <th className={`text-left px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}
