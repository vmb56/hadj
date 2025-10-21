import React, { useMemo, useState, useEffect } from "react";
import { getPayments } from "../../utils/paymentsStore";

export default function HistoriquesPaiement() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  // Charger depuis le stockage local
  useEffect(() => {
    setRows(getPayments());
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((x) =>
      `${x.ref} ${x.passeport} ${x.nom} ${x.prenoms} ${x.mode} ${x.statut}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, rows]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-lg text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-orange-400">Historiques des Paiements</h2>
          <p className="text-slate-300 text-sm">Transactions enregistrées (référence, mode, montant, statut).</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (réf., passeport, mode, statut...)"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none w-full sm:w-80"
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1100px] border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="bg-orange-500/10 text-amber-300 uppercase tracking-wide">
              <Th>#</Th><Th>Réf.</Th><Th>Passeport</Th><Th>Nom & Prénoms</Th>
              <Th>Mode</Th><Th>Montant payé</Th><Th>Total dû</Th><Th>Réduction</Th><Th>Date</Th><Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x, i) => (
              <tr key={x.id || i} className="bg-white/6 hover:bg-white/12 transition">
                <Td>{i + 1}</Td>
                <Td>{x.ref}</Td>
                <Td className="font-mono">{x.passeport}</Td>
                <Td>{x.nom} {x.prenoms}</Td>
                <Td>{x.mode}</Td>
                <Td>{Number(x.montant || 0).toLocaleString()} FCFA</Td>
                <Td>{Number(x.totalDu || 0).toLocaleString()} FCFA</Td>
                <Td>{Number(x.reduction || 0).toLocaleString()} FCFA</Td>
                <Td>{x.date}</Td>
                <Td>
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${x.statut === "Complet" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10"}`}>
                    {x.statut}
                  </span>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><Td colSpan={10} className="text-center text-slate-400 py-5">Aucun paiement trouvé</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>; }
function Td({ children, className = "", colSpan }) { return <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>; }
