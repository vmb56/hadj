// src/pages/pelerins/EnregistrementsPelerins.jsx
import React, { useMemo, useState } from "react";

/* =========================
   Données démo (remplace par ton API)
   ========================= */
const SAMPLE = [
  {
    id: 1,
    photoPelerin:
      "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=256&q=80",
    photoPasseport:
      "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=256&q=80",
    nom: "TRAORE",
    prenoms: "Ismaël O.",
    dateNaissance: "1995-08-16",
    lieuNaissance: "Abidjan",
    sexe: "Masculin",
    adresse: "Riviera, Cocody",
    contacts: "07 00 00 00 00",
    numPasseport: "AA1234567",
    offre: "Standard",
    voyage: "Vol direct - Groupe 1",
    anneeVoyage: "2025",
    urgenceNom: "KONE",
    urgencePrenoms: "Fanta",
    urgenceContact: "01 11 22 33",
    urgenceResidence: "Yopougon, Toits rouges",
    enregistrePar: "Agent: BMV Admin",
    createdAt: "2025-10-20T10:30:00Z",
  },
  {
    id: 2,
    photoPelerin: "",
    photoPasseport: "",
    nom: "KOUADIO",
    prenoms: "Aïcha",
    dateNaissance: "1992-02-04",
    lieuNaissance: "Bouaké",
    sexe: "Féminin",
    adresse: "Marcory Zone 4",
    contacts: "05 55 66 77",
    numPasseport: "BB9876543",
    offre: "Premium",
    voyage: "Vol avec escale - Groupe 2",
    anneeVoyage: "2025",
    urgenceNom: "N'DA",
    urgencePrenoms: "Mariam",
    urgenceContact: "01 22 33 44",
    urgenceResidence: "Koumassi, Remblais",
    enregistrePar: "Agent: Sarah",
    createdAt: "2025-10-21T09:02:00Z",
  },
];

/* =========================
   COMPOSANT PRINCIPAL
   ========================= */
export default function EnregistrementsPelerins({ records = SAMPLE }) {
  const [q, setQ] = useState("");
  const [sexe, setSexe] = useState("all"); // "all" | "Masculin" | "Féminin"

  // Filtrage (plein-texte + sexe exact)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return records.filter((p) => {
      const bySex =
        sexe === "all"
          ? true
          : String(p.sexe || "").toLowerCase() === sexe.toLowerCase();
      if (!bySex) return false;
      if (!s) return true;
      const hay = [
        p.nom,
        p.prenoms,
        p.contacts,
        p.numPasseport,
        p.offre,
        p.voyage,
        p.anneeVoyage,
        p.sexe,
        p.adresse,
        p.lieuNaissance,
        p.urgenceResidence,
        p.enregistrePar,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");
      return hay.includes(s);
    });
  }, [q, sexe, records]);

  const filtreLabel = sexe === "all" ? "TOUS" : sexe.toUpperCase();

  const handlePrint = () => window.print();

  return (
    <section className="mt-6">
      {/* Barre d’action (non imprimée) */}
      <div className="no-print mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Enregistrements des pèlerins
          </h2>
          <p className="text-slate-600 text-sm">
            Toutes les informations saisies + agent enregistreur.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, passeport, agent, ville, offre...)"
            className="w-full sm:w-72 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
          />
          <select
            value={sexe}
            onChange={(e) => setSexe(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
            title="Filtrer par sexe"
          >
            <option value="all">Tous</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Imprimer la liste
          </button>
        </div>
      </div>

      {/* ===================== ZONE IMPRIMABLE ===================== */}
      <div className="print-area report">
        {/* ENTÊTE */}
        <div className="print-header text-center mb-3">
          <h1 className="title">LISTE DES PÈLERINS</h1>
          <p className="subtitle">({filtreLabel})</p>
        </div>

        {/* ===== VUE CARTES (mobile & tablette) ===== */}
        <div className="cards grid gap-3 lg:hidden">
          {filtered.length === 0 ? (
            <p className="text-slate-600 text-center py-6">
              Aucun enregistrement trouvé.
            </p>
          ) : (
            filtered.map((p, i) => {
              const agentName =
                String(p.enregistrePar || "").replace(/^agent\s*:\s*/i, "").trim() ||
                "—";
              return (
                <article
                  key={p.id ?? i}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] text-slate-500">#{i + 1}</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {p.nom} {p.prenoms}
                      </div>
                      <div className="text-[13px] text-slate-600">
                        {p.sexe || "—"} • Passeport :{" "}
                        <span className="font-mono">{p.numPasseport || "—"}</span>
                      </div>
                    </div>
                    <div className="text-right text-[13px] text-slate-600">
                      <div>{formatDate(p.createdAt)}</div>
                      <div className="text-slate-900 font-semibold">
                        Agent: {agentName}
                      </div>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                    <div>
                      <dt className="text-slate-500">Naissance</dt>
                      <dd className="text-slate-800">
                        {formatDate(p.dateNaissance)} — {p.lieuNaissance || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Contact</dt>
                      <dd className="text-slate-800">{p.contacts || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Adresse</dt>
                      <dd className="text-slate-800">{p.adresse || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Offre</dt>
                      <dd className="text-slate-800">{p.offre || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Année</dt>
                      <dd className="text-slate-800">{p.anneeVoyage || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Voyage</dt>
                      <dd className="text-slate-800">{p.voyage || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Urgence</dt>
                      <dd className="text-slate-800">
                        <span className="font-semibold">
                          {p.urgenceNom} {p.urgencePrenoms}
                        </span>{" "}
                        • {p.urgenceContact} • {p.urgenceResidence}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>


        {/* ===== VUE TABLEAU (desktop & impression) ===== */}
        <div className="paper hidden lg:block">
          {filtered.length === 0 ? (
            <p className="text-slate-600 text-center py-6">
              Aucun enregistrement trouvé.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="w-full data-table">
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Nom & Prénoms</Th>
                    <Th>Date | Lieu Naiss.</Th>
                    <Th>Sexe</Th>
                    <Th>Adresse</Th>
                    <Th>Contact</Th>
                    <Th>Passeport</Th>
                    <Th>Offre</Th>
                    <Th>Voyage</Th>
                    <Th>Année</Th>
                    <Th>Urgence (Nom, Tél, Résidence)</Th>
                    <Th>Agent</Th>
                    <Th>Créé le</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const agentName =
                      String(p.enregistrePar || "")
                        .replace(/^agent\s*:\s*/i, "")
                        .trim() || "—";
                    return (
                      <tr key={p.id ?? i} className="row">
                        <Td className="muted">{i + 1}</Td>
                        <Td className="strong">
                          {p.nom} {p.prenoms}
                        </Td>
                        <Td>
                          <div>{formatDate(p.dateNaissance)}</div>
                          <div className="muted">{p.lieuNaissance || "—"}</div>
                        </Td>
                        <Td>{p.sexe || "—"}</Td>
                        <Td className="wrap">{p.adresse || "—"}</Td>
                        <Td>{p.contacts || "—"}</Td>
                        <Td className="mono">{p.numPasseport || "—"}</Td>
                        <Td>{p.offre || "—"}</Td>
                        <Td className="wrap">{p.voyage || "—"}</Td>
                        <Td>{p.anneeVoyage || "—"}</Td>
                        <Td className="wrap">
                          <span className="strong">
                            {p.urgenceNom} {p.urgencePrenoms}
                          </span>{" "}
                          • {p.urgenceContact} • {p.urgenceResidence}
                        </Td>
                        <Td className="agent">
                          <span className="muted">Agent:</span>
                          <br />
                          <span className="strong">{agentName}</span>
                        </Td>
                        <Td>{formatDate(p.createdAt)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pied de page : type de tri */}
        {filtered.length > 0 && (
          <div className="foot-note">— FIN DE LA LISTE ({filtreLabel}) —</div>
        )}
      </div>

      {/* Pagination (numéro de page) */}
      <div className="only-print print-pagination" aria-hidden />

      {/* ===================== STYLES ===================== */}
      <style>{`
        /* ---------- Écran ---------- */
        .report { max-width: 1120px; margin: 0 auto; padding: 0 10px; }

        .table-wrap {
          overflow-x: auto;
          /* pas d'ascenseur vertical inutile, header sticky visible */
          max-height: none;
        }

        .data-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 14px;
          line-height: 1.45;
          background: #fff;
          min-width: 1000px; /* évite le serrage si écran moyen */
        }
        .data-table thead { background: #eef6ff; }
        .data-table thead th {
          position: sticky; top: 0; z-index: 1; /* en-tête collante */
        }
        .data-table th, .data-table td {
          padding: 9px 10px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
          color: #0f172a;
        }
        .data-table th {
          font-size: 13px;
          color: #334155;
          font-weight: 700;
          text-align: left;
          white-space: nowrap;
          background: #eef6ff; /* pour le sticky */
        }
        .row:hover td { background: #f8fafc; }
        .wrap { white-space: normal; word-break: break-word; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .strong { font-weight: 700; }
        .muted { color: #64748b; }
        .agent .muted { font-weight: 700; color: #1f2937; }
        .foot-note {
          margin-top: 12px;
          text-align: center;
          color: #334155;
          font-weight: 600;
        }
        .print-header .title {
          font-size: 22px; font-weight: 800; color: #0f172a;
          text-decoration: underline; margin: 0;
        }
        .print-header .subtitle {
          margin-top: 4px; color: #334155; font-style: italic; font-size: 13px;
        }

        /* ---------- Mobile : cartes plus lisibles ---------- */
        .cards article dl dt { font-size: 12px; }
        .cards article dl dd { font-size: 13px; }

        /* Empêcher les lignes d'être coupées entre 2 pages */
        .row { break-inside: avoid; page-break-inside: avoid; }

        /* ---------- Impression ---------- */
        .only-print { display: none; }
        @media print {
          .only-print { display: block !important; }

          /* Mode paysage + marges */
          @page { size: A4 landscape; margin: 10mm 12mm 16mm 12mm; }
          @page { size: landscape; } /* fallback */

          /* Couleurs fidèles */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* Masquer seulement ce qu'il faut */
          .no-print, .cards { display: none !important; } /* on imprime le tableau, pas les cartes */

          /* Exploiter la largeur */
          .report { max-width: none !important; padding: 0 !important; }
          .table-wrap { overflow: visible !important; }
          .data-table { min-width: 0 !important; width: 100% !important; }

          /* Typo plus claire pour le papier */
          .data-table { font-size: 15px !important; line-height: 1.5 !important; }
          .data-table th { font-size: 14px !important; }
          .data-table th, .data-table td { padding: 8px 10px !important; }
          thead { background: #eaf2ff !important; }

          /* Numérotation des pages */
          .print-pagination {
            position: fixed; right: 12mm; bottom: 8mm;
            font-size: 12px; color: #334155;
          }
          .print-pagination::after { content: "Page " counter(page) " / " counter(pages); }
        }

        /* ---------- Ajustements tablettes ---------- */
        @media (max-width: 1024px) {
          .data-table { font-size: 13.5px; }
          .data-table th { font-size: 12.5px; }
        }
        @media (max-width: 640px) {
          .report { padding: 0 6px; }
        }
      `}</style>
    </section>
  );
}

/* ===== Cellules ===== */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-3 py-2 border-b border-slate-200 text-slate-600 text-[12px] font-semibold ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 border-b border-slate-200 text-slate-900 ${className}`}>
      {children}
    </td>
  );
}

/* ===== Helpers ===== */
function formatDate(d) {
  if (!d) return "—";
  const t = Date.parse(d);
  return Number.isNaN(t) ? "—" : new Date(t).toLocaleDateString("fr-FR");
}
