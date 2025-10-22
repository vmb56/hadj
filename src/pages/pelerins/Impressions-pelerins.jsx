// src/pages/Impressions-pelerins.jsx
import React, { useMemo, useRef, useState } from "react";

/* ====================== Données de démo ====================== */
const SAMPLE_DATA = [
  {
    id: 51,
    passport: "20AD24295",
    nomVoyage: "HAJJ",
    photo: null, // url de la photo ou base64
    nom: "BAMBA",
    prenoms: "Yaya",
    dateNaissance: "1954-10-15",
    lieuNaissance: "odienne",
    adresse: "abobo",
    contacts: "777825514",
    sexe: "M",
    offre: "option 1",
    hotel: "Hôtel du pèlerin",
    anneeVoyage: 2025,
    nomPersonneContact: "Lamine",
    contactPersonne: "077782556",
    residencePersonne: "abobo",
    employeEnregistreur: "ISMOSOG",
  },
];

/* ====================== Helpers ====================== */
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("fr-FR");
}

/* ====================== Composant principal ====================== */
export default function ImpressionsPelerins() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(SAMPLE_DATA);
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => data.find((x) => x.id === selectedId) || null,
    [data, selectedId]
  );
  const printRef = useRef(null);

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) {
      setData(SAMPLE_DATA);
      setSelectedId(null);
      return;
    }
    const filtered = SAMPLE_DATA.filter((r) =>
      r.passport.toLowerCase().includes(q)
    );
    setData(filtered);
    setSelectedId(filtered.length === 1 ? filtered[0].id : null);
  }

  function handleClear() {
    setQuery("");
    setData(SAMPLE_DATA);
    setSelectedId(null);
  }

  function handlePrint() {
    if (!selected) {
      alert("Sélectionne un enregistrement avant d’imprimer.");
      return;
    }
    requestAnimationFrame(() => window.print());
  }

  return (
    <div className="space-y-6 text-dyn">
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

      {/* ===== En-tête ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <h1 className="text-dyn-title text-slate-900">Impressions — Fiche Pèlerin</h1>
          <p className="mt-1 text-slate-600 text-dyn-sm">
            Recherche par numéro de passeport · Sélection · Impression A4
          </p>
        </div>
      </div>

      {/* ===== Barre de recherche & actions ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form
          className="p-4 flex flex-wrap items-center gap-2 md:gap-3"
          onSubmit={handleSearch}
        >
          <input
            className="w-full sm:w-[320px] rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
            placeholder="Rechercher par N° de passeport (ex : 20AD24295)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Rechercher
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            onClick={handleClear}
          >
            Effacer
          </button>
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
            onClick={handlePrint}
          >
            Imprimer la fiche
          </button>
          <div className="ml-auto text-slate-500 text-dyn-sm">
            {selected
              ? `Sélectionné : ${selected.nom} ${selected.prenoms}`
              : `${data.length} résultat(s)`}
          </div>
        </form>
      </div>

      {/* ===== Layout principal : Tableau + Aperçu ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* Tableau */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-slate-500 text-dyn-xs">
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">ID</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Nom voyage</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Photo</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Nom</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Prénoms</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Date naissance</th>
                  <th className="px-3 py-2 border-b border-slate-200 font-semibold">Passeport</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    title="Cliquer pour sélectionner"
                    className={[
                      "cursor-pointer transition",
                      selectedId === r.id
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50"
                    ].join(" ")}
                  >
                    <td className="px-3 py-2 border-b border-slate-100">{r.id}</td>
                    <td className="px-3 py-2 border-b border-slate-100">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200 text-dyn-xs">
                        ✈️ <strong className="font-semibold">{r.nomVoyage}</strong>
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100" style={{ width: 52 }}>
                      <img
                        alt={r.nom ? `Photo de ${r.nom}` : "Photo"}
                        src={r.photo || "https://via.placeholder.com/36x44?text=ID"}
                        className="h-11 w-9 rounded-md object-cover border border-slate-200"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 font-semibold text-slate-900">
                      {r.nom}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100">{r.prenoms}</td>
                    <td className="px-3 py-2 border-b border-slate-100">
                      {formatDate(r.dateNaissance)}
                    </td>
                    <td className="px-3 py-2 border-b border-slate-100 font-mono">
                      {r.passport}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Aucun enregistrement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aperçu */}
        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="flex items-start gap-3">
            <img
              alt={selected ? `Photo de ${selected.nom}` : "Photo"}
              src={selected?.photo || "https://via.placeholder.com/88x106?text=Photo"}
              className="h-[106px] w-[88px] rounded-lg object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900">
                {selected ? `${selected.nom} ${selected.prenoms}` : "Aucune sélection"}
              </div>
              <div className="text-slate-500 text-dyn-xs">
                {selected
                  ? `${selected.nomVoyage} · ${selected.anneeVoyage}`
                  : "Sélectionne une ligne pour prévisualiser"}
              </div>
              {selected && (
                <div className="mt-2 grid gap-1.5 text-slate-700 text-dyn-sm">
                  <div><strong>📇 Passeport :</strong> {selected.passport}</div>
                  <div><strong>📞 Contact :</strong> {selected.contacts}</div>
                  <div><strong>📍 Adresse :</strong> {selected.adresse}</div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
          >
            Imprimer cette fiche
          </button>
        </aside>
      </div>

      {/* ===== Zone d'impression A4 ===== */}
      <div className="print-area" ref={printRef}>
        {selected && (
          <div className="print-card" role="document" aria-label="Fiche d'inscription">
            <div className="wm">BMVT</div>

            {/* Header doc */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  alt="Logo"
                  src="https://via.placeholder.com/120x60?text=LOGO"
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <div className="text-[18px] font-black">FICHE D'INSCRIPTION</div>
                  <div className="text-[13px] text-slate-600">{selected.nomVoyage}</div>
                </div>
              </div>
              <div className="text-right text-[12px] text-slate-500">
                <div>{new Date().toLocaleDateString("fr-FR")}</div>
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
                <Row label="Identifiant de Pèlerin :" value={selected.id} />
                <Row label="Nom du Pèlerin :" value={selected.nom} />
                <Row label="Prénoms du Pèlerin :" value={selected.prenoms} />
                <Row label="Date de naissance :" value={formatDate(selected.dateNaissance)} />
                <Row label="Lieu de naissance :" value={selected.lieuNaissance} />
                <Row label="Adresse :" value={selected.adresse} />
                <Row label="Contacts :" value={selected.contacts} />
                <Row label="Sexe :" value={selected.sexe} />
              </div>
              <div className="w-[120px] text-center">
                <img
                  alt={selected ? `Photo de ${selected.nom}` : "Photo"}
                  src={selected.photo || "https://via.placeholder.com/120x160?text=Photo"}
                  className="h-[160px] w-[120px] object-cover rounded border border-slate-200"
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-800 font-extrabold mt-3 mb-2">
              INFORMATIONS CONCERNANT LE VOYAGE
            </div>
            <div>
              <Row label="Numéro de passeport :" value={selected.passport} />
              <Row label="Offre choisie :" value={selected.offre} />
              <Row label="Hôtel du pèlerin :" value={selected.hotel} />
              <Row label="Année de voyage :" value={selected.anneeVoyage} />
              <Row label="Nom du voyage :" value={selected.nomVoyage} />
            </div>

            {/* Section 3 */}
            <div className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-800 font-extrabold mt-3 mb-2">
              PERSONNE À CONTACTER EN CAS D’URGENCE
            </div>
            <div>
              <Row label="Nom :" value={selected.nomPersonneContact} />
              <Row label="Contact :" value={selected.contactPersonne} />
              <Row label="Résidence :" value={selected.residencePersonne} />
            </div>

            <div className="text-center mt-3 font-black text-slate-400">
              BMVT – Voyages & Tourismes
            </div>

            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[12px]">
              <div>
                Nom_Employeur_Enregistreur : <strong>{selected.employeEnregistreur}</strong>
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

/* ————— Petits sous-composants (impression) ————— */
function Row({ label, value }) {
  return (
    <div className="flex gap-2 my-1">
      <div className="w-[220px] font-bold text-slate-700">{label}</div>
      <div className="flex-1">{String(value ?? "—")}</div>
    </div>
  );
}
