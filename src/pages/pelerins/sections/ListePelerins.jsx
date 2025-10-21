// src/pages/pelerins/ListePelerins.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ===========================
   Démo 100% front : échantillon
   Remplace par tes données API plus tard
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
   Tailles des vignettes
=========================== */
const THUMB_DESKTOP = "h-16 w-16"; // 64×64
const THUMB_MOBILE = "h-18 w-18"; // ~72×72 visuel
const BIG_THUMB = { h: "h-56", w: "w-44" }; // Aperçu modale

/* ===========================
   Helpers UI
=========================== */
function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-white/10 text-slate-200",
    amber: "bg-amber-500/15 text-amber-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, tone = "default" }) {
  const styles = {
    default: "bg-white/10 hover:bg-white/15 text-slate-100",
    primary: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200",
    warn: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
        styles[tone] || styles.default
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`text-left px-4 py-3 first:rounded-l-lg last:rounded-r-lg whitespace-nowrap text-[13px] uppercase tracking-wide text-amber-300 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td
      className={`px-4 py-3 text-slate-200 whitespace-nowrap first:rounded-l-lg last:rounded-r-lg ${className}`}
    >
      {children}
    </td>
  );
}

function Thumb({ src, alt, mobile = false }) {
  const size = mobile ? THUMB_MOBILE : THUMB_DESKTOP;
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-xl object-cover border border-white/15 shadow-sm`}
    />
  ) : (
    <div
      className={`${size} rounded-xl grid place-content-center text-[10px] text-slate-400 border border-white/15 bg-white/5`}
    >
      N/A
    </div>
  );
}

function BigThumb({ src, label }) {
  return (
    <div className="grid gap-2">
      <div
        className={`${BIG_THUMB.h} ${BIG_THUMB.w} rounded-2xl overflow-hidden border border-white/15 bg-white/5 grid place-content-center`}
      >
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-slate-400">Aperçu</span>
        )}
      </div>
      <span className="text-xs text-slate-300">{label}</span>
    </div>
  );
}

/* ===========================
   Composant principal
=========================== */
export default function ListePelerins() {
  const navigate = useNavigate(); // ✅ Hook utilisé DANS le composant
  const [data, setData] = useState(SAMPLE);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // pour la modale "Détails"

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
    }
  }

  function onEdit(row) {
    // ✅ navigation vers la page d’édition avec state
    navigate(`/pelerins/${row.id}/edit`, { state: { row } });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8 backdrop-blur text-white shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-orange-400">Liste des Pèlerins</h2>
          <p className="text-slate-300/90 text-sm">
            Toutes les informations enregistrées (photos, infos personnelles,
            Hajj, urgence, agent…)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, passeport, agent...)"
            className="w-full sm:w-72 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-amber-400/40"
          />
        </div>
      </div>

      {/* ===== Mobile : Cartes ===== */}
      <div className="mt-6 grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-400">Aucun résultat.</p>
        ) : (
          filtered.map((p, i) => (
            <article
              key={p.id ?? i}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start gap-3">
                <Thumb src={p.photoPelerin} alt="Pèlerin" mobile />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">
                    {p.nom} {p.prenoms}
                  </div>
                  <div className="text-xs text-slate-300">
                    Passeport:{" "}
                    <span className="font-mono">
                      {p.numPasseport || "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    {p.voyage || "—"} •{" "}
                    <Badge tone="amber">{p.anneeVoyage || "—"}</Badge>
                  </div>
                </div>
                <div className="ml-auto">
                  <Thumb src={p.photoPasseport} alt="Passeport" mobile />
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <dt className="text-slate-400">Contact</dt>
                  <dd className="text-slate-200">{p.contacts || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Sexe</dt>
                  <dd className="text-slate-200">{p.sexe || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Adresse</dt>
                  <dd className="text-slate-200">{p.adresse || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Urgence</dt>
                  <dd className="text-slate-200">
                    {p.urgenceNom} {p.urgencePrenoms} • {p.urgenceContact} •{" "}
                    {p.urgenceResidence}
                  </dd>
                </div>
                <div className="col-span-2 text-slate-300">
                  Enregistré par :{" "}
                  <span className="text-amber-300 font-semibold">
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

      {/* ===== Desktop : Tableau large ===== */}
      <div className="mt-6 overflow-x-auto hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-slate-400">Aucun résultat.</p>
        ) : (
          <table className="min-w-[1280px] border-separate border-spacing-y-3 text-[15px]">
            <thead>
              <tr className="bg-amber-500/10">
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
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id ?? i}
                  className="bg-white/6 hover:bg-white/12 transition-all"
                >
                  <Td className="text-slate-400">{i + 1}</Td>

                  <Td>
                    <Thumb src={p.photoPelerin} alt="Pèlerin" />
                  </Td>

                  <Td>
                    <div className="font-semibold text-white">
                      {p.nom} {p.prenoms}
                    </div>
                  </Td>

                  <Td>
                    <div className="text-slate-200">
                      {formatDate(p.dateNaissance)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.lieuNaissance || "—"}
                    </div>
                  </Td>

                  <Td>{p.sexe || "—"}</Td>
                  <Td className="max-w-[220px] truncate">
                    {p.adresse || "—"}
                  </Td>
                  <Td>{p.contacts || "—"}</Td>

                  <Td>
                    <div className="font-mono">{p.numPasseport || "—"}</div>
                  </Td>

                  <Td>{p.offre || "—"}</Td>

                  <Td className="max-w-[220px] truncate">
                    {p.voyage || "—"}
                  </Td>

                  <Td>
                    <Badge tone="amber">{p.anneeVoyage || "—"}</Badge>
                  </Td>

                  <Td className="max-w-[280px]">
                    <div className="truncate">
                      <span className="font-semibold">
                        {p.urgenceNom} {p.urgencePrenoms}
                      </span>{" "}
                      • {p.urgenceContact} • {p.urgenceResidence}
                    </div>
                  </Td>

                  <Td>
                    <Thumb src={p.photoPasseport} alt="Passeport" />
                  </Td>

                  <Td className="text-amber-300 font-semibold">
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
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-[min(980px,95vw)] max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-orange-300">
                Détails — {selected.nom} {selected.prenoms}
              </h3>
              <button
                className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                onClick={() => setSelected(null)}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-[auto,1fr,auto]">
              <BigThumb src={selected.photoPelerin} label="Photo pèlerin" />

              <div className="grid gap-3">
                <DetailSection title="Informations personnelles">
                  <Info
                    label="Nom & Prénoms"
                    value={`${selected.nom} ${selected.prenoms}`}
                  />
                  <Info
                    label="Naissance"
                    value={`${formatDate(selected.dateNaissance)} — ${
                      selected.lieuNaissance || "—"
                    }`}
                  />
                  <Info label="Sexe" value={selected.sexe || "—"} />
                  <Info label="Adresse" value={selected.adresse || "—"} />
                  <Info label="Contacts" value={selected.contacts || "—"} />
                </DetailSection>

                <DetailSection title="Hajj">
                  <Info label="Passeport" value={selected.numPasseport || "—"} />
                  <Info label="Offre" value={selected.offre || "—"} />
                  <Info label="Voyage" value={selected.voyage || "—"} />
                  <Info label="Année" value={selected.anneeVoyage || "—"} />
                </DetailSection>

                <DetailSection title="Urgence">
                  <Info
                    label="Nom & Prénoms"
                    value={
                      `${selected.urgenceNom || ""} ${
                        selected.urgencePrenoms || ""
                      }`.trim() || "—"
                    }
                  />
                  <Info label="Contact" value={selected.urgenceContact || "—"} />
                  <Info
                    label="Résidence"
                    value={selected.urgenceResidence || "—"}
                  />
                </DetailSection>

                <DetailSection title="Enregistrement">
                  <Info label="Agent" value={selected.enregistrePar || "—"} />
                  <Info label="Date" value={formatDate(selected.createdAt)} />
                </DetailSection>
              </div>

              <BigThumb src={selected.photoPasseport} label="Photo passeport" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Sous-blocs pour la modale
=========================== */
function DetailSection({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-amber-300">
        {title}
      </div>
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="text-sm">
      <span className="text-slate-400">{label} : </span>
      <span className="text-slate-100">{value || "—"}</span>
    </div>
  );
}
