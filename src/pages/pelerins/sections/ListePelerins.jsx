// src/pages/pelerins/ListePelerins.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ===========================
   Démo 100% front : échantillon
   (remplace avec ton API)
=========================== */
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

/* ===========================
   Helpers
=========================== */
function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200 text-dyn-xs font-semibold">
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, tone = "default" }) {
  const styles = {
    default:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    primary:
      "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    warn: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-xl px-3 py-2 text-dyn-sm font-semibold transition ${styles[tone] || styles.default}`}
    >
      {children}
    </button>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`text-left px-3 py-2 border-b border-slate-200 text-slate-500 text-dyn-xs font-semibold ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td
      className={`px-3 py-3 border-b border-slate-100 text-slate-800 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}

function Thumb({ src, alt, size = "md" }) {
  const cls =
    size === "md"
      ? "h-16 w-16"
      : size === "sm"
      ? "h-[72px] w-[72px]"
      : "h-16 w-16";
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`${cls} rounded-xl object-cover border border-slate-200 bg-white`}
    />
  ) : (
    <div
      className={`${cls} rounded-xl grid place-content-center text-dyn-xs text-slate-400 border border-slate-200 bg-slate-50`}
    >
      N/A
    </div>
  );
}

/* ===========================
   Composant principal
=========================== */
export default function ListePelerins() {
  const navigate = useNavigate();
  const [data, setData] = useState(SAMPLE);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // pour la modale

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((p) =>
      [
        p.nom,
        p.prenoms,
        p.contacts,
        p.numPasseport,
        p.offre,
        p.voyage,
        p.anneeVoyage,
        p.enregistrePar,
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q, data]);

  function onDelete(row) {
    if (window.confirm(`Supprimer ${row.nom} ${row.prenoms} ?`)) {
      setData((prev) => prev.filter((x) => x.id !== row.id));
      if (selected?.id === row.id) setSelected(null);
    }
  }

  function onEdit(row) {
    navigate(`/pelerins/${row.id}/edit`, { state: { row } });
  }

  return (
    <div className="space-y-6 text-dyn">
      {/* En-tête / barre d'action */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-4 md:p-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-dyn-title text-slate-900">Liste des Pèlerins</h2>
            <p className="text-slate-600 text-dyn-sm">
              Photos, informations personnelles, Hajj, urgence, agent…
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, passeport, agent...)"
              className="w-full md:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* ===== Mobile : Cartes ===== */}
      <div className="grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-500">Aucun résultat.</p>
        ) : (
          filtered.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Thumb src={p.photoPelerin} alt="Pèlerin" size="sm" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {p.nom} {p.prenoms}
                  </div>
                  <div className="text-dyn-xs text-slate-500">
                    Passeport:{" "}
                    <span className="font-mono text-slate-800">
                      {p.numPasseport || "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-dyn-xs text-slate-600">
                    {p.voyage || "—"} • <Badge>{p.anneeVoyage || "—"}</Badge>
                  </div>
                </div>
                <div className="ml-auto">
                  <Thumb src={p.photoPasseport} alt="Passeport" size="sm" />
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-dyn-sm">
                <div>
                  <dt className="text-slate-500">Contact</dt>
                  <dd className="text-slate-800">{p.contacts || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Sexe</dt>
                  <dd className="text-slate-800">{p.sexe || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Adresse</dt>
                  <dd className="text-slate-800">{p.adresse || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Urgence</dt>
                  <dd className="text-slate-800">
                    {p.urgenceNom} {p.urgencePrenoms} • {p.urgenceContact} •{" "}
                    {p.urgenceResidence}
                  </dd>
                </div>
                <div className="col-span-2 text-slate-600">
                  Enregistré par :{" "}
                  <span className="text-slate-900 font-semibold">
                    {p.enregistrePar || "—"}
                  </span>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-end gap-2">
                <ActionButton tone="primary" onClick={() => setSelected(p)}>
                  Détails
                </ActionButton>
                <ActionButton onClick={() => onEdit(p)}>Modifier</ActionButton>
                <ActionButton tone="warn" onClick={() => onDelete(p)}>
                  Supprimer
                </ActionButton>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ===== Desktop : Tableau ===== */}
      <div className="overflow-x-auto hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-slate-500">Aucun résultat.</p>
        ) : (
          <table className="min-w-[1280px] text-dyn">
            <thead className="bg-blue-50">
              <tr>
                <Th>#</Th>
                <Th>Photo</Th>
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
                <Th>Passeport (photo)</Th>
                <Th>Agent</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.map((p, i) => (
                <tr
                  key={p.id ?? i}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <Td className="text-slate-500">{i + 1}</Td>

                  <Td>
                    <Thumb src={p.photoPelerin} alt="Pèlerin" />
                  </Td>

                  <Td>
                    <div className="font-semibold text-slate-900">
                      {p.nom} {p.prenoms}
                    </div>
                  </Td>

                  <Td>
                    <div className="text-slate-800">
                      {formatDate(p.dateNaissance)}
                    </div>
                    <div className="text-dyn-xs text-slate-500">
                      {p.lieuNaissance || "—"}
                    </div>
                  </Td>

                  <Td>{p.sexe || "—"}</Td>
                  <Td className="max-w-[240px] truncate">{p.adresse || "—"}</Td>
                  <Td>{p.contacts || "—"}</Td>

                  <Td className="font-mono">{p.numPasseport || "—"}</Td>

                  <Td>{p.offre || "—"}</Td>

                  <Td className="max-w-[260px] truncate">{p.voyage || "—"}</Td>

                  <Td>
                    <Badge>{p.anneeVoyage || "—"}</Badge>
                  </Td>

                  <Td className="max-w-[320px]">
                    <div className="truncate">
                      <span className="font-semibold text-slate-900">
                        {p.urgenceNom} {p.urgencePrenoms}
                      </span>{" "}
                      • {p.urgenceContact} • {p.urgenceResidence}
                    </div>
                  </Td>

                  <Td>
                    <Thumb src={p.photoPasseport} alt="Passeport" />
                  </Td>

                  <Td className="text-slate-900 font-semibold">
                    {p.enregistrePar || "—"}
                  </Td>

                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <ActionButton tone="primary" onClick={() => setSelected(p)}>
                        Détails
                      </ActionButton>
                      <ActionButton onClick={() => onEdit(p)}>Modifier</ActionButton>
                      <ActionButton tone="warn" onClick={() => onDelete(p)}>
                        Supprimer
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== Modale Détails ===== */}
      {selected && (
        <DetailsModal data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ===========================
   Modale Détails (bleu & blanc)
=========================== */
function DetailsModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(980px,95vw)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-dyn-title text-slate-900">
            Détails — {data.nom} {data.prenoms}
          </h3>
          <button
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-[auto,1fr,auto]">
          <BigThumbW src={data.photoPelerin} label="Photo pèlerin" />

          <div className="grid gap-3">
            <DetailSection title="Informations personnelles">
              <Info label="Nom & Prénoms" value={`${data.nom} ${data.prenoms}`} />
              <Info
                label="Naissance"
                value={`${formatDate(data.dateNaissance)} — ${data.lieuNaissance || "—"}`}
              />
              <Info label="Sexe" value={data.sexe || "—"} />
              <Info label="Adresse" value={data.adresse || "—"} />
              <Info label="Contacts" value={data.contacts || "—"} />
            </DetailSection>

            <DetailSection title="Hajj">
              <Info label="Passeport" value={data.numPasseport || "—"} />
              <Info label="Offre" value={data.offre || "—"} />
              <Info label="Voyage" value={data.voyage || "—"} />
              <Info label="Année" value={data.anneeVoyage || "—"} />
            </DetailSection>

            <DetailSection title="Urgence">
              <Info
                label="Nom & Prénoms"
                value={`${data.urgenceNom || ""} ${data.urgencePrenoms || ""}`.trim() || "—"}
              />
              <Info label="Contact" value={data.urgenceContact || "—"} />
              <Info label="Résidence" value={data.urgenceResidence || "—"} />
            </DetailSection>

            <DetailSection title="Enregistrement">
              <Info label="Agent" value={data.enregistrePar || "—"} />
              <Info label="Date" value={formatDate(data.createdAt)} />
            </DetailSection>
          </div>

          <BigThumbW src={data.photoPasseport} label="Photo passeport" />
        </div>
      </div>
    </div>
  );
}

function BigThumbW({ src, label }) {
  return (
    <div className="grid gap-2">
      <div className="h-56 w-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 grid place-content-center">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-dyn-sm text-slate-500">Aperçu</span>
        )}
      </div>
      <span className="text-dyn-xs text-slate-500">{label}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-dyn-xs font-extrabold uppercase tracking-wider text-blue-700">
        {title}
      </div>
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="text-dyn-sm">
      <span className="text-slate-500">{label} : </span>
      <span className="text-slate-900">{value || "—"}</span>
    </div>
  );
}
