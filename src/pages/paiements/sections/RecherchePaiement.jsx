// src/pages/paiement/RecherchePaiement.jsx
import React, { useMemo, useState, useEffect } from "react";

/* --------------------------------------------------------------------------
   CONFIG API — consomme https://hadjbackend.onrender.com
   - Pas de cookies (credentials: "omit")
   - Auth via Authorization: Bearer bmvt_token
-------------------------------------------------------------------------- */
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ----------------------------- helper GET JSON ----------------------------- */
async function getJson(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    // 🔒 pas de cookies
    credentials: "omit",
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ----------------------------- normalisations ------------------------------ */
const toUrl = (val) => {
  if (!val) return null;
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  if (val.startsWith("/")) return `${API_BASE}${val}`;
  return `${API_BASE}/${val}`;
};

// Pèlerin (vient de /api/pelerinspaiement)
function normalizePelerin(r = {}) {
  const passeport = r.passeport ?? r.num_passeport ?? r.NUM_PASSEPORT ?? "";
  const photoPelerin =
    r.photoPelerin ?? r.photo_pelerin ?? r.photo_pelerin_path
      ? toUrl(r.photoPelerin || r.photo_pelerin || r.photo_pelerin_path)
      : null;
  const photoPasseport =
    r.photoPasseport ?? r.photo_passeport ?? r.photo_passeport_path
      ? toUrl(r.photoPasseport || r.photo_passeport || r.photo_passeport_path)
      : null;

  return {
    id: r.id,
    nom: r.nom,
    prenoms: r.prenoms,
    passeport,
    // valeur brute côté pelerins (id ou texte) — on l'écrasera par l'offre courante
    offre: r.offre ?? r.offre_id ?? r.nom_offre ?? null,
    // prix éventuellement présent côté pelerins — on l'écrasera par l'offre courante
    prixOffre: Number(r.prixOffre ?? r.prix_offre ?? 0),
    photoPelerin: photoPelerin || null,
    photoPasseport: photoPasseport || null,
    contact: r.contact ?? null,
  };
}

// Paiement (vient de /api/paiements)
function normalizePayment(r = {}) {
  return {
    id: r.id,
    ref: r.ref,
    passeport: r.passeport,
    nom: r.nom,
    prenoms: r.prenoms,
    mode: r.mode,
    montant: Number(r.montant ?? r.montant_paye ?? 0),
    totalDu: Number(r.totalDu ?? r.total_du ?? 0),
    reduction: Number(r.reduction ?? 0),
    date: r.date ?? r.date_paiement ?? null,
    statut: r.statut,
  };
}

// Offre (vient de /api/offres)
function normalizeOffre(o = {}) {
  return {
    id: Number(o.id),
    nom: o.nom ?? o.nom_offre ?? "",
    prix: Number(o.prix ?? o.prix_offre ?? 0),
    hotel: o.hotel ?? "",
    dateDepart: o.dateDepart ?? o.date_depart ?? null,
    dateArrivee: o.dateArrivee ?? o.date_arrivee ?? null,
    createdAt: o.createdAt ?? o.created_at ?? null,
    updatedAt: o.updatedAt ?? o.updated_at ?? null,
  };
}

/* ---------------------------------- API ----------------------------------- */
const api = {
  async getPelerinsEtPaiements({ search = "" } = {}) {
    const url = new URL(`${API_BASE}/api/pelerinspaiement`);
    if (search) url.searchParams.set("search", search);
    const data = await getJson(url.toString());
    const pelerins = (data?.pelerins || []).map(normalizePelerin);
    const payments = (data?.payments || []).map(normalizePayment);
    return { pelerins: pelerins.filter((x) => x.passeport), payments };
  },

  async getOffres() {
    const data = await getJson(`${API_BASE}/api/offres`);
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeOffre);
  },

  async addPayment(payload) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/paiements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      credentials: "omit", // 🔒 pas de cookies
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    return normalizePayment(data);
  },

  // ⚠️ IMPORTANT: URL alignée sur ta route backend: /api/paiements/versements
  async addVersement(payload) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/paiements/versements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      credentials: "omit", // 🔒 pas de cookies
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    return data;
  },
};

/* ------------------------------ UI / logique ------------------------------ */
const fmt = (n) =>
  n === "" || n == null || isNaN(Number(n)) ? "0" : Number(n).toLocaleString("fr-FR");

/** On force les champs de l'offre courante (nom/prix/hôtel) dans chaque row */
function attachCurrentOffreToRow(row, currentOffre) {
  if (!currentOffre) return { ...row, offre: null, prixOffre: 0, hotelOffre: "" };
  return {
    ...row,
    offre: currentOffre.nom || null, // « Nom offres »
    prixOffre: Number(currentOffre.prix || 0), // « Prix offres »
    hotelOffre: currentOffre.hotel || "", // « Hotel »
  };
}

/** État de paiement — jamais "Soldé" par défaut si prix inconnu */
function computePaymentState(row, allPayments) {
  const payments = (allPayments || []).filter((p) => p.passeport === row.passeport);
  const dejaPaye = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const lockedReduction = (() => {
    const found = payments.find((p) => Number(p.reduction || 0) > 0);
    return found ? Number(found.reduction) : 0;
  })();

  const prix = Number(row.prixOffre || 0);
  const hasListedPrice = prix > 0;

  if (!hasListedPrice) {
    const statut = dejaPaye > 0 ? "En cours" : "Nouveau";
    return { dejaPaye, lockedReduction, totalDu: 0, reste: 0, statut };
  }

  const totalDu = Math.max(prix - lockedReduction, dejaPaye);
  const reste = Math.max(totalDu - dejaPaye, 0);
  const statut = reste === 0 ? "Soldé" : dejaPaye > 0 ? "En cours" : "Nouveau";
  return { dejaPaye, lockedReduction, totalDu, reste, statut };
}

export default function RecherchePaiement() {
  const [q, setQ] = useState("");
  const [pelerins, setPelerins] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);
  const [soldInfo, setSoldInfo] = useState(null);

  async function reloadAll() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const [{ pelerins: P, payments: Pay }, Offres] = await Promise.all([
        api.getPelerinsEtPaiements({ search: q.trim() }),
        api.getOffres(),
      ]);

      // On prend l’offre la plus récente (ta route trie déjà DESC par created_at)
      const currentOffre = Offres[0] || null;

      // On injecte nom/prix/hôtel dans CHAQUE pèlerin
      const enriched = P.map((row) => attachCurrentOffreToRow(row, currentOffre));

      setPelerins(enriched);
      setPayments(Pay);
    } catch (e) {
      console.error("[RecherchePaiement] reloadAll error:", e);
      setErr(e.message || "Erreur de chargement");
      setPelerins([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async () => {
    if (loading) return;
    await reloadAll();
  };
  const onEnter = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const tryOpenPayment = (row) => {
    const { totalDu, reste, dejaPaye, lockedReduction } = computePaymentState(row, payments);
    if (Number(row.prixOffre || 0) > 0 && reste <= 0) {
      setSoldInfo({ row, totalDu, dejaPaye, reduction: lockedReduction });
      return;
    }
    setSelected(row);
  };

  return (
    <div className="space-y-4 text-dyn">
      {/* En-tête / recherche */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-dyn-title font-extrabold text-slate-900">
          Recherche Informations Paiement
        </h2>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Sélectionne un pèlerin pour ouvrir la fenêtre de paiement.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] text-slate-600">Rechercher un pèlerin</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onEnter}
              placeholder="N° passeport / Nom / Contact"
              className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 placeholder:text-slate-400"
            />
            <button
              className="rounded-xl bg-sky-600/90 text-white px-3 py-2 text-[13.5px] hover:brightness-110 disabled:opacity-60"
              onClick={onSearch}
              disabled={loading}
              type="button"
            >
              {loading ? "Recherche…" : "Rechercher"}
            </button>
          </div>
        </div>

        {loading && <div className="mt-2 text-slate-500 text-sm">Chargement…</div>}
        {err && (
          <div className="mt-2 text-rose-600 text-sm">
            {err}
            <div className="text-[11px] text-slate-500 mt-1">
              API_BASE: <span className="font-mono">{API_BASE || "(vide)"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] text-[15px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase tracking-wide text-[12.5px]">
                <Th>Photo du pèlerin</Th>
                <Th>Nom du pèlerin</Th>
                <Th>Numéro de passeport</Th>
                <Th>Passeport du pèlerin</Th>
                <Th>Offre / Hôtel / État</Th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-slate-200">
              {pelerins.map((r) => {
                const { statut, reste } = computePaymentState(r, payments);
                return (
                  <tr
                    key={r.id || r.passeport}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => tryOpenPayment(r)}
                    title="Cliquer pour ouvrir la fenêtre Paiement"
                  >
                    <Td>
                      {r.photoPelerin ? (
                        <img
                          src={r.photoPelerin}
                          alt="Pèlerin"
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-500">
                          —
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div className="font-extrabold tracking-wide text-slate-900">{r.nom}</div>
                      <div className="text-slate-600 text-sm">{r.prenoms}</div>
                    </Td>
                    <Td className="font-mono text-slate-800">{r.passeport}</Td>
                    <Td>
                      {r.photoPasseport ? (
                        <img
                          src={r.photoPasseport}
                          alt="Passeport"
                          className="h-20 w-36 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-20 w-36 rounded-lg bg-slate-100 border border-slate-200 grid place-items-center text-slate-400">
                          —
                        </div>
                      )}
                    </Td>
                    <Td className="align-middle">
                      <div className="font-bold text-slate-900">{r.offre || "—"}</div>
                      {r.hotelOffre && (
                        <div className="text-xs text-slate-600 mt-0.5">Hôtel : {r.hotelOffre}</div>
                      )}
                      <div className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs">
                        {statut === "Soldé" && <Chip tone="emerald">Soldé</Chip>}
                        {statut === "En cours" && (
                          <>
                            <Chip tone="amber">En cours</Chip>
                            <span className="text-slate-700">
                              Reste&nbsp;
                              <span className="ml-1 font-mono font-semibold text-slate-900">
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
              {pelerins.length === 0 && !loading && (
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
        <PaiementModal
          row={selected}
          payments={payments}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            await reloadAll();
          }}
        />
      )}
      {soldInfo && <SoldModal info={soldInfo} onClose={() => setSoldInfo(null)} />}
    </div>
  );
}

/* ============ Modale Paiement ============ */
function PaiementModal({ row, payments, onClose, onSaved }) {
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("Espèces");
  const [reduction, setReduction] = useState(0);
  const [montantPayer, setMontantPayer] = useState(0);
  const [success, setSuccess] = useState(null); // ✅ infos à afficher après paiement

  const paiementsPrecedents = useMemo(
    () => (payments || []).filter((p) => p.passeport === row.passeport),
    [payments, row.passeport]
  );
  const dejaPaye = useMemo(
    () => paiementsPrecedents.reduce((s, p) => s + Number(p.montant || 0), 0),
    [paiementsPrecedents]
  );

  const lockedReduction = useMemo(() => {
    const found = paiementsPrecedents.find((p) => Number(p.reduction || 0) > 0);
    return found ? Number(found.reduction) : null;
  }, [paiementsPrecedents]);

  // ===== Calculs
  const prixOffre = Number(row.prixOffre || 0);
  const hasListedPrice = prixOffre > 0;

  const reductionEffective = lockedReduction ?? Number(reduction || 0);
  const redSafe = Math.min(Math.max(reductionEffective, 0), Math.max(prixOffre, 0));

  const totalSouhaite = hasListedPrice
    ? Math.max(prixOffre - redSafe, dejaPaye)
    : dejaPaye + Math.max(Number(montantPayer || 0), 0);

  const resteAvant = Math.max(totalSouhaite - dejaPaye, 0);
  const montantMax = hasListedPrice
    ? Math.max(0, Math.min(totalSouhaite, resteAvant))
    : Number.MAX_SAFE_INTEGER;

  const paySafe = Math.min(Math.max(Number(montantPayer || 0), 0), montantMax);
  const resteApres = hasListedPrice ? Math.max(resteAvant - paySafe, 0) : 0;

  const [errors, setErrors] = useState({});
  useEffect(() => {
    const e = {};
    if (!datePaiement) e.datePaiement = "Date obligatoire";
    if (!mode) e.mode = "Mode obligatoire";

    if (Number(montantPayer) <= 0) {
      e.montantPayer = "Le montant à payer est obligatoire et doit être > 0.";
    } else if (hasListedPrice && paySafe !== Number(montantPayer || 0)) {
      e.montantPayer = `Montant ajusté entre 0 et ${fmt(montantMax)} FCFA.`;
    }

    if (hasListedPrice && lockedReduction == null && redSafe !== Number(reduction || 0)) {
      e.reduction = "Réduction ajustée (0 … prix de l’offre).";
    }

    if (hasListedPrice && montantMax === 0) {
      e.soldé = "Dossier soldé : aucun paiement autorisé.";
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
    hasListedPrice,
  ]);

  const valider = async () => {
    if (Number(montantPayer) <= 0 || Object.keys(errors).length) return;

    const statut = hasListedPrice && resteApres === 0 ? "Complet" : "Partiel";
    const reductionToPersist = hasListedPrice && lockedReduction != null ? 0 : redSafe;

    try {
      const created = await api.addPayment({
        passeport: row.passeport,
        nom: row.nom,
        prenoms: row.prenoms,
        mode,
        montant: Number(paySafe || 0),
        totalDu: hasListedPrice ? Number(totalSouhaite || 0) : 0,
        reduction: hasListedPrice ? Number(reductionToPersist || 0) : 0,
        date: datePaiement,
        statut,
      });

      await api.addVersement({
        passeport: row.passeport,
        nom: row.nom,
        prenoms: row.prenoms,
        echeance: datePaiement,
        verse: Number(paySafe || 0),
        restant: hasListedPrice ? Number(resteApres || 0) : 0,
        statut: hasListedPrice ? (resteApres === 0 ? "Soldé" : "En cours") : "En cours",
      });

      // ✅ On met à jour la liste coté parent
      await onSaved?.();

      // ✅ Et on ouvre une modale de récapitulatif
      setSuccess({
        ref: created?.ref || null,
        nom: row.nom,
        prenoms: row.prenoms,
        passeport: row.passeport,
        prixOffre,
        reduction: hasListedPrice ? reductionToPersist : 0,
        totalDu: hasListedPrice ? totalSouhaite : dejaPaye + paySafe,
        dejaPayeAvant: dejaPaye,
        dejaPayeApres: dejaPaye + paySafe,
        payeMaintenant: paySafe,
        resteApres: hasListedPrice ? resteApres : 0,
        mode,
        date: datePaiement,
        statutFinal: hasListedPrice ? (resteApres === 0 ? "Soldé" : "En cours") : "En cours",
      });
    } catch (e) {
      alert(e.message || "Erreur lors de l’enregistrement du paiement.");
    }
  };

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

  const closeAll = () => {
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[min(1180px,98vw)] max-h-[95vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">Paiement</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-[150px,1fr]">
          <div className="grid place-items-start">
            {row.photoPelerin ? (
              <img
                src={row.photoPelerin}
                alt="Pèlerin"
                className="h-28 w-28 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div className="h-28 w-28 rounded-xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-500">
                —
              </div>
            )}
            <div className="mt-2 text-xs text-slate-600">PHOTO PÈLERIN</div>
          </div>

          <div className="grid gap-3">
            <Read label="Numéro de passeport du pèlerin" value={row.passeport} mono />
            <div className="grid sm:grid-cols-2 gap-3">
              <Read label="Nom du pèlerin" value={row.nom} />
              <Read label="Prénoms du pèlerin" value={row.prenoms} />
            </div>

            {/* CHAMPS issus de la table OFFRES */}
            <div className="grid sm:grid-cols-5 gap-3">
              <Read label="Nom offres" value={row.offre} />
              <Read label="Prix offres" value={`${fmt(row.prixOffre)} FCFA`} />
              <Read label="Hotel" value={row.hotelOffre || "—"} />
              <Read label="Déjà payé" value={`${fmt(dejaPaye)} FCFA`} />
              <Read label="Reste (avant)" value={`${fmt(resteAvant)} FCFA`} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <FieldDate
                label="Date paiement"
                value={datePaiement}
                onChange={setDatePaiement}
                error={errors.datePaiement}
              />
              <Select
                label="Mode de paiement"
                value={mode}
                onChange={setMode}
                options={["Espèces", "Mobile Money", "Chèque", "Virement"]}
                error={errors.mode}
              />

              {hasListedPrice && lockedReduction != null ? (
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
              ) : hasListedPrice ? (
                <FieldMoney
                  label="Réduction"
                  value={String(reduction)}
                  onChange={onNumReduction}
                  help={`0 … ${fmt(row.prixOffre)} FCFA`}
                  error={errors.reduction}
                />
              ) : (
                <div className="grid">
                  <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">
                    Réduction
                  </div>
                  <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    N/A (offre sans prix)
                  </div>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Read
                label="Total dû (après réduction)"
                value={
                  hasListedPrice ? `${fmt(totalSouhaite)} FCFA` : "— (offre sans prix, paiement libre)"
                }
              />
              <FieldMoney
                label="Montant payé maintenant"
                value={String(montantPayer)}
                onChange={onNumMontant}
                help={
                  !hasListedPrice
                    ? "Offre sans prix : paiement libre."
                    : montantMax === 0
                    ? "Aucun paiement autorisé (dossier soldé)."
                    : `max ${fmt(montantMax)} FCFA`
                }
                error={errors.montantPayer || errors.soldé}
              />
              <Read label="Reste (après)" value={hasListedPrice ? `${fmt(resteApres)} FCFA` : "—"} />
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

        <div className="mt-4">
          {row.photoPasseport ? (
            <img
              src={row.photoPasseport}
              alt="Passeport"
              className="h-48 w-32 object-cover rounded-md border border-slate-200"
            />
          ) : (
            <div className="h-48 w-32 rounded-md bg-slate-100 border border-slate-200 grid place-items-center text-slate-500">
              —
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modale de confirmation affichée juste après le paiement */}
      {success && <PaymentSuccessModal info={success} onClose={closeAll} />}
    </div>
  );
}

/* --------- Modale “Paiement soldé” --------- */
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
            Le dossier de <span className="font-semibold">{row?.nom} {row?.prenoms}</span> (passeport{" "}
            <span className="font-mono">{row?.passeport}</span>) est{" "}
            <span className="text-emerald-700 font-bold">déjà soldé</span>.
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

/* --------- Modale “Paiement effectué” --------- */
function PaymentSuccessModal({ info, onClose }) {
  if (!info) return null;
  const {
    ref,
    nom,
    prenoms,
    passeport,
    prixOffre,
    reduction,
    totalDu,
    dejaPayeAvant,
    dejaPayeApres,
    payeMaintenant,
    resteApres,
    mode,
    date,
    statutFinal,
  } = info;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[min(680px,95vw)] rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold text-sky-700 flex items-center gap-2">
              Paiement enregistré
            </h3>
            {ref && (
              <div className="mt-0.5 text-xs text-slate-500">
                Référence : <span className="font-mono">{ref}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
            <div className="font-semibold text-slate-900">
              {nom} {prenoms}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Passeport : <span className="font-mono">{passeport}</span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Date : {date || "—"} · Mode : {mode}
            </div>
            <div className="mt-1 inline-flex items-center gap-2">
              <Chip tone={statutFinal === "Soldé" ? "emerald" : "amber"}>
                Statut : {statutFinal}
              </Chip>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Detail label="Prix offre" value={`${fmt(prixOffre)} FCFA`} />
            <Detail label="Réduction" value={`${fmt(reduction)} FCFA`} />
            <Detail label="Total dû" value={`${fmt(totalDu)} FCFA`} />
            <Detail label="Déjà payé (avant)" value={`${fmt(dejaPayeAvant)} FCFA`} />
            <Detail label="Montant payé maintenant" value={`${fmt(payeMaintenant)} FCFA`} />
            <Detail label="Déjà payé (après)" value={`${fmt(dejaPayeApres)} FCFA`} />
            <Detail label="Reste après paiement" value={`${fmt(resteApres)} FCFA`} />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[13px] text-slate-700">
            Tu peux maintenant fermer cette fenêtre ou revenir à la liste des pèlerins.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- sous-composants ---------- */
function Detail({ label, value }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
      <div className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
        {value || "—"}
      </div>
    </div>
  );
}
function Chip({ children, tone = "slate" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-[12px] font-semibold ${
        styles[tone] || styles.slate
      }`}
    >
      {children}
    </span>
  );
}
function Th({ children }) {
  return <th className="text-left px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap align-middle ${className}`}>
      {children}
    </td>
  );
}
function Read({ label, value, mono = false }) {
  return (
    <div className="grid">
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
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
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
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
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
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
      <div className="text-[11px] font-black tracking-wide text-slate-600 uppercase">{label}</div>
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
