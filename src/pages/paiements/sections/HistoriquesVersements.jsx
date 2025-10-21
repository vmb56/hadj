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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-lg text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-orange-400">Historiques des Versements</h2>
          <p className="text-slate-300 text-sm">Suivi des acomptes et restes à payer.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (passeport, nom, statut...)"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none w-full sm:w-80"
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="bg-orange-500/10 text-amber-300 uppercase tracking-wide">
              <Th>#</Th><Th>Passeport</Th><Th>Nom & Prénoms</Th><Th>Échéance</Th><Th>Versé</Th><Th>Restant</Th><Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x, i) => (
              <tr key={x.id || i} className="bg-white/6 hover:bg-white/12 transition">
                <Td>{i + 1}</Td>
                <Td className="font-mono">{x.passeport}</Td>
                <Td>{x.nom} {x.prenoms}</Td>
                <Td>{x.echeance}</Td>
                <Td>{Number(x.verse || 0).toLocaleString()} FCFA</Td>
                <Td>{Number(x.restant || 0).toLocaleString()} FCFA</Td>
                <Td>
                  <span className={`${x.statut === "Soldé" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10"} rounded-lg px-2 py-0.5 text-xs font-semibold`}>
                    {x.statut}
                  </span>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><Td colSpan={7} className="text-center text-slate-400 py-5">Aucun versement trouvé</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>; }
function Td({ children, className = "", colSpan }) { return <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>; }
