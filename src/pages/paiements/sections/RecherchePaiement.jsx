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
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-lg text-white">
      <h2 className="text-xl font-bold text-orange-400">
        Recherche Informations Paiement
      </h2>
      <p className="text-slate-300 text-sm">
        Sélectionne un pèlerin pour ouvrir la fenêtre de paiement.
      </p>

      {/* Filtres */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Rechercher un pèlerin</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N° passeport / Nom"
            className="w-64 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
          />
          <button
            className="rounded-xl bg-gradient-to-tr from-amber-400/30 to-amber-500/30 px-3 py-2 text-sm"
            onClick={() => {}}
            type="button"
          >
            Rechercher
          </button>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-300">Offres</span>
          <select
            value={offre}
            onChange={(e) => setOffre(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
          >
            {OFFRES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[1100px] border-separate border-spacing-y-3 text-[15px]">
          <thead>
            <tr className="bg-orange-500/10 text-amber-300 uppercase tracking-wide">
              <Th>Photo du pèlerin</Th>
              <Th>Nom du pèlerin</Th>
              <Th>Numéro de passeport</Th>
              <Th>Passeport du pèlerin</Th>
              <Th>Offre / État</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const { statut, reste } = computePaymentState(r);
              return (
                <tr
                  key={r.id}
                  className="bg-white/6 hover:bg-gradient-to-r hover:from-orange-400/30 hover:to-amber-400/30 cursor-pointer transition"
                  onClick={() => tryOpenPayment(r)}
                  title="Cliquer pour ouvrir la fenêtre Paiement"
                >
                  <Td>
                    <img
                      src={r.photoPelerin}
                      alt="Pèlerin"
                      className="h-16 w-16 rounded-xl object-cover border border-white/15"
                    />
                  </Td>
                  <Td>
                    <div className="font-extrabold tracking-wide">{r.nom}</div>
                    <div className="text-slate-300 text-sm">{r.prenoms}</div>
                  </Td>
                  <Td className="font-mono">{r.passeport}</Td>
                  <Td>
                    <img
                      src={r.photoPasseport}
                      alt="Passeport"
                      className="h-20 w-36 rounded-lg object-cover border border-white/15"
                    />
                  </Td>
                  <Td className="align-middle">
                    <div className="font-bold">{r.offre}</div>
                    <div className="mt-1 inline-flex items-center gap-2 text-xs">
                      {statut === "Soldé" && (
                        <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-emerald-200 font-semibold">
                          Soldé
                        </span>
                      )}
                      {statut === "En cours" && (
                        <>
                          <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-amber-200 font-semibold">
                            En cours
                          </span>
                          <span className="text-slate-300">
                            Reste&nbsp;: <span className="font-mono">{fmt(reste)}</span> FCFA
                          </span>
                        </>
                      )}
                      {statut === "Nouveau" && (
                        <span className="rounded-lg bg-white/10 px-2 py-0.5 text-slate-200 font-semibold">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center text-slate-400 py-6">
                  Aucun résultat
                </Td>
              </tr>
            )}
          </tbody>
        </table>
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

/* ============ Modale Paiement avec contraintes ============ */
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

    // montant obligatoire (> 0)
    if (Number(montantPayer) <= 0) {
      e.montantPayer = "Le montant à payer est obligatoire et doit être > 0.";
    } else if (paySafe !== Number(montantPayer || 0)) {
      e.montantPayer = `Montant ajusté entre 0 et ${fmt(
        montantMax
      )} FCFA (ne peut pas dépasser le total dû ni le reste à payer).`;
    }

    // réduction : message uniquement si elle est éditable (pas verrouillée)
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
    // re-check obligatoire montant > 0
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

    // ✅ On enregistre la réduction à 0 si déjà appliquée auparavant
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
      reduction: reductionToPersist, // 0 si déjà appliquée
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[min(1180px,98vw)] rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl text-white">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-extrabold tracking-widest text-red-400">
            PAIEMENTS
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
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
              className="h-28 w-28 rounded-xl object-cover border border-white/15"
            />
            <div className="mt-2 text-xs text-slate-300">PHOTO PÈLERIN</div>
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
                  <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
                    Réduction (verrouillée)
                  </div>
                  <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    {fmt(lockedReduction)} FCFA{" "}
                    <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-amber-300">
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
                className="w-full sm:w-auto rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-700 px-6 py-2 font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="h-48 w-32 object-cover rounded-md border border-white/10"
          />
        </div>
      </div>
    </div>
  );
}

/* --------- Modale “Paiement soldé” --------- */
function SoldModal({ info, onClose }) {
  const { row, totalDu, dejaPaye, reduction } = info || {};
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,95vw)] rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-6 shadow-2xl text-white">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-extrabold text-emerald-300">Paiement soldé</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-3">
          <p className="text-slate-200">
            Le dossier de <span className="font-semibold">{row?.nom} {row?.prenoms}</span> (passeport <span className="font-mono">{row?.passeport}</span>) est <span className="text-emerald-300 font-bold">déjà soldé</span>.
          </p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <Detail label="Prix offre" value={`${fmt(row?.prixOffre)} FCFA`} />
            <Detail label="Réduction appliquée" value={`${fmt(reduction || 0)} FCFA`} />
            <Detail label="Total dû final" value={`${fmt(totalDu)} FCFA`} />
            <Detail label="Déjà payé" value={`${fmt(dejaPaye)} FCFA`} />
          </div>
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-200 text-sm">
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
      <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">{label}</div>
      <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}

/* ---------- sous-composants ---------- */
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
      <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm ${
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
      <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
        {label}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
      />
      {error && <span className="text-xs text-rose-300 mt-1">{error}</span>}
    </div>
  );
}
function FieldMoney({ label, value, onChange, help, error }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input
          inputMode="numeric"
          value={value}
          onChange={onChange}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none font-mono"
        />
        <span className="text-xs text-slate-300">FCFA</span>
      </div>
      {help && <div className="text-[11px] text-slate-400 mt-1">{help}</div>}
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}
function Select({ label, value, onChange, options, error }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-300 mt-1">{error}</span>}
    </div>
  );
}
