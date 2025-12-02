// src/pages/Impressions-pelerins.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo.png";

/* ====================== Config API ====================== */
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ====================== Helpers ====================== */
function mediaURL(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = API_BASE.replace(/\/+$/, "");
  const rel = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR");
}

/** Mappe une ligne de la table `pelerins` → format utilisé par cette page */
function normalizeRow(r) {
  return {
    id: r.id,
    passport: r.num_passeport || r.numPasseport || "",
    nomVoyage: r.voyage ? String(r.voyage).toUpperCase() : "HAJJ",
    photo: mediaURL(r.photo_pelerin_path || r.photoPelerin || ""),
    nom: r.nom || "",
    prenoms: r.prenoms || "",
    dateNaissance: r.date_naissance || "",
    lieuNaissance: r.lieu_naissance || "",
    adresse: r.adresse || "",
    contacts: r.contact || "",
    sexe: r.sexe || "", // "M" | "F"
    offre: r.offre || "",
    hotel: r.hotel || "—",
    anneeVoyage: r.annee_voyage ?? r.anneeVoyage ?? "",
    nomPersonneContact: r.ur_nom || "",
    contactPersonne: r.ur_contact || "",
    residencePersonne: r.ur_residence || "",
    employeEnregistreur: r.created_by_name || r.createdByName || "—",
  };
}

/* ====================== Mini toast ====================== */
function useToast() {
  const [msg, setMsg] = useState(null); // {text,type}
  const push = (text, type = "ok") => {
    setMsg({ text, type });
    clearTimeout(push._t);
    push._t = setTimeout(() => setMsg(null), 2400);
  };
  const Toast = () => (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className={
            "fixed bottom-5 right-5 z-[60] rounded-xl px-4 py-3 text-sm shadow-xl text-white " +
            (msg.type === "err" ? "bg-rose-600" : "bg-emerald-600")
          }
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { push, Toast };
}

/* ====================== Composant principal ====================== */
export default function ImpressionsPelerins() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const printRef = useRef(null);
  const { push, Toast } = useToast();

  const selected = useMemo(
    () => data.find((x) => x.id === selectedId) || null,
    [data, selectedId]
  );

  /* -------- Chargement initial -------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/pelerins`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = j?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const j = await res.json();
        const normalized = (Array.isArray(j?.items) ? j.items : []).map(
          normalizeRow
        );
        setData(normalized);
        if (normalized.length === 1) setSelectedId(normalized[0].id);
      } catch (e) {
        setErr(e.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* -------- Recherche par passeport (?search=) -------- */
  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    try {
      setLoading(true);
      setErr("");
      const token = getToken();
      const url = new URL(`${API_BASE}/api/pelerins`);
      if (q) url.searchParams.set("search", q);

      const res = await fetch(url.toString(), {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const j = await res.json();
      const normalized = (Array.isArray(j?.items) ? j.items : []).map(
        normalizeRow
      );
      setData(normalized);
      setSelectedId(normalized.length === 1 ? normalized[0].id : null);
      push(q ? "Recherche mise à jour 🔎" : "Liste rechargée");
    } catch (e) {
      setErr(e.message || "Échec de la recherche");
      push("Erreur de recherche", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setQuery("");
    setSelectedId(null);
    await handleSearch(new Event("submit"));
  }

  function handlePrint() {
    if (!selected) {
      push("Sélectionne un enregistrement avant d’imprimer", "err");
      return;
    }
    push("Génération de l’aperçu d’impression 🖨️");
    requestAnimationFrame(() => window.print());
  }

  return (
    <div className="space-y-6 text-dyn">
      <Toast />

      {/* ====== Styles impression A4 uniquement ====== */}
      <style>{`
        .print-card {
          width: 210mm;
          background: #fff;
          color: #111;
          padding: 18mm;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
          position: relative;
        }
        .wm {
          position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%) rotate(-8deg);
          font-weight:900; font-size:120px;
          color: rgba(37,99,235,0.06); letter-spacing: 2px;
          user-select:none; pointer-events:none;
        }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; inset: 0; margin: 0; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* ===== En-tête animé ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="absolute -top-8 -right-12 h-28 w-28 rounded-full bg-blue-100 blur-2xl opacity-70" />
        <div className="p-6">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-dyn-title text-slate-900"
          >
            Impressions — Fiche Pèlerin
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-1 text-slate-600 text-dyn-sm"
          >
            Recherche par numéro de passeport · Sélection · Impression A4
          </motion.p>
          {loading && (
            <p className="text-slate-500 text-dyn-xs mt-2 animate-pulse">
              Chargement…
            </p>
          )}
          {err && <p className="text-rose-600 text-dyn-xs mt-2">{err}</p>}
        </div>
      </motion.div>

      {/* ===== Barre de recherche & actions (micro-interactions) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <form
          className="p-4 flex flex-wrap items-center gap-2 md:gap-3"
          onSubmit={handleSearch}
        >
          <motion.input
            whileFocus={{ scale: 1.01 }}
            className="w-full sm:w-[320px] rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 transition"
            placeholder="Rechercher par N° de passeport (ex : AA1234567)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <MotionBtn type="submit" tone="primary">
            Rechercher
          </MotionBtn>
          <MotionBtn type="button" onClick={handleClear}>
            Effacer
          </MotionBtn>
          <MotionBtn type="button" tone="soft" onClick={handlePrint}>
            Imprimer la fiche
          </MotionBtn>
          <div className="ml-auto text-slate-500 text-dyn-sm">
            {selected
              ? `Sélectionné : ${selected.nom} ${selected.prenoms}`
              : `${data.length} résultat(s)`}
          </div>
        </form>
      </motion.div>

      {/* ===== Layout principal : Tableau + Aperçu ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* Tableau */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-slate-500 text-dyn-xs">
                  <Th>ID</Th>
                  <Th>Nom voyage</Th>
                  <Th>Photo</Th>
                  <Th>Nom</Th>
                  <Th>Prénoms</Th>
                  <Th>Date naissance</Th>
                  <Th>Passeport</Th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data.map((r, idx) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{
                        delay: Math.min(idx * 0.015, 0.2),
                      }}
                      onClick={() => {
                        setSelectedId(r.id);
                        push(`Sélection : ${r.nom} ${r.prenoms}`);
                      }}
                      title="Cliquer pour sélectionner"
                      className={[
                        "cursor-pointer transition",
                        selectedId === r.id
                          ? "bg-blue-50/60"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Td>{r.id}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200 text-dyn-xs">
                          ✈️{" "}
                          <strong className="font-semibold">
                            {r.nomVoyage}
                          </strong>
                        </span>
                      </Td>
                      <Td style={{ width: 52 }}>
                        <motion.img
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          alt={
                            r.nom ? `Photo de ${r.nom}` : "Photo d'identité"
                          }
                          src={
                            r.photo ||
                            "https://via.placeholder.com/36x44?text=ID"
                          }
                          className="h-11 w-9 rounded-md object-cover border border-slate-200 shadow-sm"
                        />
                      </Td>
                      <Td className="font-semibold text-slate-900">
                        {r.nom}
                      </Td>
                      <Td>{r.prenoms}</Td>
                      <Td>{formatDate(r.dateNaissance)}</Td>
                      <Td className="font-mono">{r.passport}</Td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {data.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Aucun enregistrement
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4">
                      <SkeletonRows />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Aperçu */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
        >
          <div className="flex items-start gap-3">
            <motion.img
              key={selected?.photo || "no-photo"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              alt={
                selected ? `Photo de ${selected.nom}` : "Photo d'identité"
              }
              src={
                selected?.photo ||
                "https://via.placeholder.com/88x106?text=Photo"
              }
              className="h-[106px] w-[88px] rounded-lg object-cover border border-slate-200 shadow-sm"
            />
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900">
                {selected
                  ? `${selected.nom} ${selected.prenoms}`
                  : "Aucune sélection"}
              </div>
              <div className="text-slate-500 text-dyn-xs">
                {selected
                  ? `${selected.nomVoyage} · ${
                      selected.anneeVoyage || "—"
                    }`
                  : "Sélectionne une ligne pour prévisualiser"}
              </div>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 grid gap-1.5 text-slate-700 text-dyn-sm"
                >
                  <div>
                    <strong>📇 Passeport :</strong> {selected.passport}
                  </div>
                  <div>
                    <strong>📞 Contact :</strong> {selected.contacts}
                  </div>
                  <div>
                    <strong>📍 Adresse :</strong> {selected.adresse}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          <MotionBtn className="mt-4 w-full" tone="soft" onClick={handlePrint}>
            Imprimer cette fiche
          </MotionBtn>
        </motion.aside>
      </div>

      {/* ===== Zone d'impression A4 ===== */}
      <div className="print-area" ref={printRef}>
        {selected && (
          <div
            className="print-card"
            role="document"
            aria-label="Fiche d'inscription"
          >
            <div className="wm">BMVT</div>

            {/* Header doc */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  alt="Logo"
                  src={Logo}
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <div className="text-[18px] font-black">
                    FICHE D'INSCRIPTION
                  </div>
                  <div className="text-[13px] text-slate-600">
                    {selected.nomVoyage}
                  </div>
                </div>
              </div>
              <div className="text-right text-[12px] text-slate-500">
                <div>
                  {new Date().toLocaleDateString("fr-FR")}
                </div>
                <div>
                  {new Date().toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <div className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-800 font-extrabold mb-2">
              INFORMATIONS PERSONNELLES DU PÈLERIN
            </div>
            <div className="flex gap-5">
              <div className="flex-1">
                <Row
                  label="Identifiant de Pèlerin :"
                  value={selected.id}
                />
                <Row
                  label="Nom du Pèlerin :"
                  value={selected.nom}
                />
                <Row
                  label="Prénoms du Pèlerin :"
                  value={selected.prenoms}
                />
                <Row
                  label="Date de naissance :"
                  value={formatDate(selected.dateNaissance)}
                />
                <Row
                  label="Lieu de naissance :"
                  value={selected.lieuNaissance}
                />
                <Row
                  label="Adresse :"
                  value={selected.adresse}
                />
                <Row
                  label="Contacts :"
                  value={selected.contacts}
                />
                <Row label="Sexe :" value={selected.sexe} />
              </div>
              <div className="w-[120px] text-center">
                <img
                  alt={
                    selected ? `Photo de ${selected.nom}` : "Photo"
                  }
                  src={
                    selected.photo ||
                    "https://via.placeholder.com/120x160?text=Photo"
                  }
                  className="h-[160px] w-[120px] object-cover rounded border border-slate-200"
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-800 font-extrabold mt-3 mb-2">
              INFORMATIONS CONCERNANT LE VOYAGE
            </div>
            <div>
              <Row
                label="Numéro de passeport :"
                value={selected.passport}
              />
              <Row
                label="Offre choisie :"
                value={selected.offre}
              />
              <Row
                label="Hôtel du pèlerin :"
                value={selected.hotel}
              />
              <Row
                label="Année de voyage :"
                value={selected.anneeVoyage}
              />
              <Row
                label="Nom du voyage :"
                value={selected.nomVoyage}
              />
            </div>

            {/* Section 3 */}
            <div className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-800 font-extrabold mt-3 mb-2">
              PERSONNE À CONTACTER EN CAS D’URGENCE
            </div>
            <div>
              <Row
                label="Nom :"
                value={selected.nomPersonneContact}
              />
              <Row
                label="Contact :"
                value={selected.contactPersonne}
              />
              <Row
                label="Résidence :"
                value={selected.residencePersonne}
              />
            </div>

            <div className="text-center mt-3 font-black text-slate-400">
              BMVT – Voyages & Tourismes
            </div>

            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[12px]">
              <div>
                Nom_Employeur_Enregistreur :{" "}
                <strong>{selected.employeEnregistreur}</strong>
              </div>
              <img
                alt="signature"
                src="https://via.placeholder.com/160x44?text=Signature"
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ————— UI bits ————— */
function Th({ children }) {
  return (
    <th className="px-3 py-2 border-b border-slate-200 font-semibold">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td
      className={`px-3 py-2 border-b border-slate-100 text-slate-900 ${className}`}
    >
      {children}
    </td>
  );
}

function MotionBtn({ tone = "default", className = "", children, ...props }) {
  const styles = {
    default:
      "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50",
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 border border-transparent shadow-sm",
    soft: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      {...props}
      className={`rounded-xl px-4 py-2 font-semibold transition ${styles[tone]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

function SkeletonRows() {
  return (
    <div className="grid gap-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-8 w-full bg-slate-100 rounded-md animate-pulse"
        />
      ))}
    </div>
  );
}

/* ————— Impression rows ————— */
function Row({ label, value }) {
  return (
    <div className="flex gap-2 my-1">
      <div className="w-[220px] font-bold text-slate-700">{label}</div>
      <div className="flex-1">{String(value ?? "—")}</div>
    </div>
  );
}
