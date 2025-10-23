// src/pages/paiement/RecherchePaiement.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  addPayment,
  addVersement,
  generatePaymentRef,
  getPayments,
} from "../../utils/paymentsStore";

/* ---------- Utilitaires ---------- */
const safeId = () =>
  (typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function" &&
    window.crypto.randomUUID()) ||
  `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("fr-FR");

/* ====== Données de démo ====== */
const SAMPLE = [
  {
    id: 1,
    photoPelerin:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&q=80",
    nom: "BAMBA",
    prenoms: "Yaya",
    passeport: "20AD24295",
    photoPasseport:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?w=256&q=80",
    offre: "OPTION 1",
    hotel: "Hôtel Riyad DE",
    prixOffre: 5350000,
    contact: "0556491797",
  },
  {
    id: 2,
    photoPelerin:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=256&q=80",
    nom: "ABDOULAYE",
    prenoms: "DOUKOURE",
    passeport: "23AP09976",
    photoPasseport:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?w=256&q=80",
    offre: "OPTION 1",
    hotel: "Hôtel Riyad DE",
    prixOffre: 5350000,
    contact: "0556491797",
  },
  {
    id: 3,
    photoPelerin:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80",
    nom: "ADOU",
    prenoms: "K.",
    passeport: "20AD35573",
    photoPasseport:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?w=256&q=80",
    offre: "OPTION 1",
    hotel: "Hôtel Riyad DE",
    prixOffre: 5350000,
    contact: "070000000",
  },
  {
    id: 4,
    photoPelerin:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=256&q=80",
    nom: "BAKAYOKO",
    prenoms: "M.",
    passeport: "34AV53041",
    photoPasseport:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?w=256&q=80",
    offre: "OPTION 1",
    hotel: "Hôtel Riyad DE",
    prixOffre: 5350000,
    contact: "0102030405",
  },
  {
    id: 5,
    photoPelerin:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80",
    nom: "BALAI",
    prenoms: "S.",
    passeport: "24AX02337",
    photoPasseport:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?w=256&q=80",
    offre: "OPTION 2",
    hotel: "Hôtel Riyad DE",
    prixOffre: 4850000,
    contact: "070707070",
  },
];

const OFFRES = ["TOUTES", "OPTION 1", "OPTION 2"];

/* ---- Calcule l’état de paiement (soldé / en cours / nouveau) ---- */
function computePaymentState(row) {
  const payments = getPayments().filter((p) => p.passeport === row.passeport);
  const dejaPaye = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const lockedReduction = (() => {
    const found = payments.find((p) => Number(p.reduction || 0) > 0);
    return found ? Number(found.reduction) : 0;
  })();
  const prix = row.prixOffre ?? 0;
  const totalDu = Math.max(prix - lockedReduction, dejaPaye);
  const reste = Math.max(totalDu - dejaPaye, 0);
  const statut = reste === 0 ? "Soldé" : dejaPaye > 0 ? "En cours" : "Nouveau";
  return { dejaPaye, lockedReduction, totalDu, reste, statut };
}

export default function RecherchePaiement() {
  const [q, setQ] = useState("");
  const [offre, setOffre] = useState("TOUTES");
  const [selected, setSelected] = useState(null);
  const [soldInfo, setSoldInfo] = useState(null); // modale “soldé”

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SAMPLE.filter((r) => {
      const okText =
        !s || `${r.nom} ${r.prenoms} ${r.passeport}`.toLowerCase().includes(s);
      const okOffre = offre === "TOUTES" || r.offre === offre;
      return okText && okOffre;
    });
  }, [q, offre]);

  // Empêche d'ouvrir la modale de paiement si soldé → ouvre une modale info
  const tryOpenPayment = (row) => {
    const { totalDu, reste, dejaPaye, lockedReduction } = computePaymentState(row);
    if (reste <= 0) {
      setSoldInfo({ row, totalDu, dejaPaye, reduction: lockedReduction });
      return;
    }
    setSelected(row);
  };

  return (
    <div className="space-y-4 text-dyn">
      {/* En-tête / filtres (carte claire) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-dyn-title font-extrabold text-slate-900">
          Recherche Informations Paiement
        </h2>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Sélectionne un pèlerin pour ouvrir la fenêtre de paiement.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Rechercher un pèlerin</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="N° passeport / Nom"
              className="w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 placeholder:text-slate-400"
            />
            <button
              className="rounded-xl bg-sky-600/90 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
              onClick={() => {}}
              type="button"
            >
              Rechercher
            </button>
          </div>

          <div className="sm:ml-auto flex items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Offres</span>
            <select
              value={offre}
              onChange={(e) => setOffre(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200"
            >
              {OFFRES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau (carte claire) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] text-[15px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase tracking-wide text-[12.5px]">
                <Th>Photo du pèlerin</Th>
                <Th>Nom du pèlerin</Th>
                <Th>Numéro de passeport</Th>
                <Th>Passeport du pèlerin</Th>
                <Th>Offre / État</Th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-slate-200">
              {filtered.map((r) => {
                const { statut, reste } = computePaymentState(r);
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => tryOpenPayment(r)}
                    title="Cliquer pour ouvrir la fenêtre Paiement"
                  >
                    <Td>
                      <img
                        src={r.photoPelerin}
                        alt="Pèlerin"
                        className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                      />
                    </Td>
                    <Td>
                      <div className="font-extrabold tracking-wide text-slate-900">{r.nom}</div>
                      <div className="text-slate-600 text-sm">{r.prenoms}</div>
                    </Td>
                    <Td className="font-mono text-slate-800">{r.passeport}</Td>
                    <Td>
                      <img
                        src={r.photoPasseport}
                        alt="Passeport"
                        className="h-20 w-36 rounded-lg object-cover border border-slate-200"
                      />
                    </Td>
                    <Td className="align-middle">
                      <div className="font-bold text-slate-900">{r.offre}</div>
                      <div className="mt-1 inline-flex items-center gap-2 text-xs">
                        {statut === "Soldé" && <Chip tone="emerald">Soldé</Chip>}
                        {statut === "En cours" && (
                          <>
                            <Chip tone="amber">En cours</Chip>
                            <span className="text-slate-700">
                              Reste&nbsp;:{" "}
                              <span className="font-mono font-semibold text-slate-900">
                                {fmt(reste)}
                              </span>{" "}
                              FCFA
                            </span>
                          </>
                        )}
                        {statut === "Nouveau" && <Chip tone="slate">Nouveau</Chip>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-center text-slate-500 py-6">
                    Aucun résultat
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {selected && (
        <PaiementModal row={selected} onClose={() => setSelected(null)} />
      )}
      {soldInfo && (
        <SoldModal info={soldInfo} onClose={() => setSoldInfo(null)} />
      )}
    </div>
  );
}

/* ============ Modale Paiement (thème clair) ============ */
function PaiementModal({ row, onClose }) {
  // champs éditables
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [mode, setMode] = useState("Espèces");
  const [reduction, setReduction] = useState(0);
  const [montantPayer, setMontantPayer] = useState(0);

  // paiements antérieurs du même passeport
  const paiementsPrecedents = useMemo(
    () => getPayments().filter((p) => p.passeport === row.passeport),
    [row.passeport]
  );
  const dejaPaye = useMemo(
    () => paiementsPrecedents.reduce((s, p) => s + Number(p.montant || 0), 0),
    [paiementsPrecedents]
  );

  // 🔒 Réduction verrouillée si déjà appliquée auparavant
  const lockedReduction = useMemo(() => {
    const found = paiementsPrecedents.find((p) => Number(p.reduction || 0) > 0);
    return found ? Number(found.reduction) : null;
  }, [paiementsPrecedents]);

  const prixOffre = row.prixOffre ?? 0;

  // Réduction effective = verrouillée si existe, sinon saisie utilisateur
  const reductionEffective = lockedReduction ?? Number(reduction || 0);

  // Réduction bornée [0, prixOffre]
  const redSafe = Math.min(Math.max(reductionEffective, 0), prixOffre);

  // Total dû après réduction (ne descend jamais sous "déjà payé")
  const totalSouhaite = Math.max(prixOffre - redSafe, dejaPaye);

  // Reste à payer avant ce versement
  const resteAvant = Math.max(totalSouhaite - dejaPaye, 0);

  // 👉 Montant max autorisé : ne peut pas dépasser NI le total dû NI le reste
  const montantMax = Math.max(0, Math.min(totalSouhaite, resteAvant));

  // Saisie bornée [0, montantMax]
  const paySafe = Math.min(Math.max(Number(montantPayer || 0), 0), montantMax);

  const resteApres = Math.max(resteAvant - paySafe, 0);

  // Validation UI
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const e = {};
    if (!datePaiement) e.datePaiement = "Date obligatoire";
    if (!mode) e.mode = "Mode obligatoire";

    if (Number(montantPayer) <= 0) {
      e.montantPayer = "Le montant à payer est obligatoire et doit être > 0.";
    } else if (paySafe !== Number(montantPayer || 0)) {
      e.montantPayer = `Montant ajusté entre 0 et ${fmt(
        montantMax
      )} FCFA (ne peut pas dépasser le total dû ni le reste à payer).`;
    }

    if (lockedReduction == null && redSafe !== Number(reduction || 0)) {
      e.reduction =
        "Réduction ajustée (0 … prix de l’offre) et ne peut pas faire descendre le total sous le déjà payé.";
    }

    if (montantMax === 0) {
      e.soldé = "Dossier soldé : aucun paiement supplémentaire autorisé.";
    }
    setErrors(e);
  }, [
    datePaiement,
    mode,
    reduction,
    montantPayer,
    redSafe,
    paySafe,
    montantMax,
    lockedReduction,
  ]);

  const valider = () => {
    if (Number(montantPayer) <= 0) {
      setErrors((prev) => ({
        ...prev,
        montantPayer: "Le montant à payer est obligatoire et doit être > 0.",
      }));
      return;
    }
    if (Object.keys(errors).length) return;

    const ref = generatePaymentRef();
    const statut = resteApres === 0 ? "Complet" : "Partiel";

    const reductionToPersist = lockedReduction != null ? 0 : redSafe;

    addPayment({
      id: safeId(),
      ref,
      passeport: row.passeport,
      nom: row.nom,
      prenoms: row.prenoms,
      mode,
      montant: paySafe,
      totalDu: totalSouhaite,
      reduction: reductionToPersist,
      date: datePaiement,
      statut,
    });

    addVersement({
      id: safeId(),
      passeport: row.passeport,
      nom: row.nom,
      prenoms: row.prenoms,
      echeance: datePaiement,
      verse: paySafe,
      restant: resteApres,
      statut: resteApres === 0 ? "Soldé" : "En cours",
    });

    alert(
      `Paiement enregistré (#${ref})\nDéjà payé (avant): ${fmt(
        dejaPaye
      )} FCFA\nTotal dû: ${fmt(totalSouhaite)} FCFA\nPayé maintenant: ${fmt(
        paySafe
      )} FCFA\nReste: ${fmt(resteApres)} FCFA`
    );
    onClose();
  };

  // handlers numériques sûrs
  const onNumReduction = (e) => {
    const v = e.target.value.replace(/\s/g, "");
    if (v === "") return setReduction(0);
    if (/^\d+$/.test(v)) setReduction(Number(v));
  };
  const onNumMontant = (e) => {
    const v = e.target.value.replace(/\s/g, "");
    if (v === "") return setMontantPayer(0);
    if (/^\d+$/.test(v)) setMontantPayer(Number(v));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[min(1180px,98vw)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Paiement
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-[150px,1fr]">
          {/* Photo */}
          <div className="grid place-items-start">
            <img
              src={row.photoPelerin}
              alt="Pèlerin"
              className="h-28 w-28 rounded-xl object-cover border border-slate-200"
            />
            <div className="mt-2 text-xs text-slate-600">PHOTO PÈLERIN</div>
          </div>

          {/* Form bloc */}
          <div className="grid gap-3">
            <Read label="Numéro de passeport du pèlerin" value={row.passeport} mono />
            <div className="grid sm:grid-cols-2 gap-3">
              <Read label="Nom du pèlerin" value={row.nom} />
              <Read label="Prénoms du pèlerin" value={row.prenoms} />
            </div>

            {/* Contexte financier */}
            <div className="grid sm:grid-cols-4 gap-3">
              <Read label="Nom offre" value={row.offre} />
              <Read label="Prix offre" value={`${fmt(row.prixOffre)} FCFA`} />
              <Read label="Déjà payé" value={`${fmt(dejaPaye)} FCFA`} />
              <Read label="Reste (avant)" value={`${fmt(resteAvant)} FCFA`} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <FieldDate label="Date paiement" value={datePaiement} onChange={setDatePaiement} error={errors.datePaiement} />
              <Select label="Mode de paiement" value={mode} onChange={setMode} options={["Espèces", "Mobile Money", "Chèque", "Virement"]} error={errors.mode} />

              {/* Réduction : verrouillée = lecture seule */}
              {lockedReduction != null ? (
                <div className="grid">
                  <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
                    Réduction (verrouillée)
                  </div>
                  <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {fmt(lockedReduction)} FCFA{" "}
                    <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-slate-300">
                      verrouillée
                    </span>
                  </div>
                </div>
              ) : (
                <FieldMoney
                  label="Réduction"
                  value={String(reduction)}
                  onChange={onNumReduction}
                  help={`0 … ${fmt(row.prixOffre)} FCFA`}
                  error={errors.reduction}
                />
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Read label="Total dû (après réduction)" value={`${fmt(totalSouhaite)} FCFA`} />
              <FieldMoney
                label="Montant payé maintenant"
                value={String(montantPayer)}
                onChange={onNumMontant}
                help={
                  montantMax === 0
                    ? "Aucun paiement autorisé (dossier soldé)."
                    : `max ${fmt(montantMax)} FCFA`
                }
                error={errors.montantPayer || errors.soldé}
              />
              <Read label="Reste (après)" value={`${fmt(resteApres)} FCFA`} />
            </div>

            <div className="pt-2">
              <button
                onClick={valider}
                disabled={Object.keys(errors).length > 0}
                className="w-full sm:w-auto rounded-lg bg-sky-600 text-white px-6 py-2 font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                type="button"
              >
                VALIDER
              </button>
            </div>
          </div>
        </div>

        {/* aperçu passeport */}
        <div className="mt-4">
          <img
            src={row.photoPasseport}
            alt="Passeport"
            className="h-48 w-32 object-cover rounded-md border border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}

/* --------- Modale “Paiement soldé” (claire) --------- */
function SoldModal({ info, onClose }) {
  const { row, totalDu, dejaPaye, reduction } = info || {};
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,95vw)] rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-extrabold text-emerald-700">Paiement soldé</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-3">
          <p className="text-slate-800">
            Le dossier de <span className="font-semibold">{row?.nom} {row?.prenoms}</span> (passeport <span className="font-mono">{row?.passeport}</span>) est <span className="text-emerald-700 font-bold">déjà soldé</span>.
          </p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <Detail label="Prix offre" value={`${fmt(row?.prixOffre)} FCFA`} />
            <Detail label="Réduction appliquée" value={`${fmt(reduction || 0)} FCFA`} />
            <Detail label="Total dû final" value={`${fmt(totalDu)} FCFA`} />
            <Detail label="Déjà payé" value={`${fmt(dejaPaye)} FCFA`} />
          </div>
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 text-sm">
            Aucun paiement supplémentaire n’est autorisé pour ce dossier.
          </div>
        </div>
      </div>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
      <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">{value || "—"}</div>
    </div>
  );
}

/* ---------- sous-composants ---------- */
function Chip({ children, tone = "slate" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  return (
    <span className={`rounded-lg px-2 py-0.5 text-[12px] font-semibold ${styles[tone] || styles.slate}`}>
      {children}
    </span>
  );
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 whitespace-nowrap align-middle ${className}`}
    >
      {children}
    </td>
  );
}
function Read({ label, value, mono = false }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}
function FieldDate({ label, value, onChange, error }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
        {label}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-sky-200"
      />
      {error && <span className="text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
function FieldMoney({ label, value, onChange, help, error }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input
          inputMode="numeric"
          value={value}
          onChange={onChange}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none font-mono ring-2 ring-transparent focus:ring-sky-200"
        />
        <span className="text-xs text-slate-600">FCFA</span>
      </div>
      {help && <div className="text-[11px] text-slate-500 mt-1">{help}</div>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
function Select({ label, value, onChange, options, error }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-sky-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
