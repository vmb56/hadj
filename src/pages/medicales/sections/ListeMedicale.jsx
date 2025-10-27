// src/pages/medicales/ListeMedicale.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ========= Config API ========= */
// On lit l’URL de l’API depuis Vite/CRA, sinon fallback localhost:4000
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

// Token si tu utilises Authorization: Bearer
const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ========= Normalisation des données backend -> UI =========
   Le backend renvoie des champs snake_case (ex: numero_cmah).
   On les transforme ici en camelCase pour la vue. */
function normalizeRow(r = {}) {
  return {
    id: r.id,
    numeroCMAH: r.numero_cmah || r.numeroCMAH || "",
    passeport: r.passeport || "",
    nom: r.nom || "",
    prenoms: r.prenoms || "",
    pouls: r.pouls || "",
    carnetVaccins: r.carnet_vaccins || r.carnetVaccins || "",
    groupeSanguin: r.groupe_sanguin || r.groupeSanguin || "",
    covid: r.covid || "",
    poids: r.poids || "",
    tension: r.tension || "",
    vulnerabilite: r.vulnerabilite || "",
    diabete: r.diabete || "",
    maladieCardiaque: r.maladie_cardiaque || r.maladieCardiaque || "",
    analysePsychiatrique: r.analyse_psychiatrique || r.analysePsychiatrique || "",
    accompagnements: r.accompagnements || "",
    examenParaclinique: r.examen_paraclinique || r.examenParaclinique || "",
    antecedents: r.antecedents || "",
    createdAt: r.created_at || r.createdAt || null,
    updatedAt: r.updated_at || r.updatedAt || null,
  };
}

/* ========= Helpers UI (thème bleu) ========= */
function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, tone = "default" }) {
  const styles = {
    default: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    primary: "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
    edit: "border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    warn: "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${styles[tone] || styles.default}`}
    >
      {children}
    </button>
  );
}
function Th({ children }) {
  return (
    <th className="text-left px-4 py-3 whitespace-nowrap text-[13px] uppercase tracking-wide text-blue-700">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 whitespace-nowrap text-slate-700 ${className}`}>{children}</td>;
}

/* ==========================
   Composant principal
========================== */
export default function ListeMedicale() {
  const navigate = useNavigate();

  // Données chargées depuis l’API
  const [data, setData] = useState([]);
  // Recherche locale (champ input)
  const [q, setQ] = useState("");
  // Ligne sélectionnée pour la modale "Détails"
  const [selected, setSelected] = useState(null);
  // États réseau
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const debounceRef = useRef(null);

  /* -------- Fetch liste depuis l’API --------
     On interroge GET /api/medicales?search=… (voir ta route backend).
     On applique un "debounce" léger sur la recherche pour éviter le spam. */
  async function fetchList(search = "") {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/medicales`);
      if (search) url.searchParams.set("search", search);

      const token = getToken();
      const res = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include", // OK même si tu ne l’utilises pas (CORS est configuré)
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const payload = await res.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setData(items.map(normalizeRow));
    } catch (e) {
      setErr(e.message || "Échec du chargement");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // Au montage, on charge la liste
  useEffect(() => {
    fetchList("");
  }, []);

  // Quand l’utilisateur tape dans la recherche, on relance le fetch (debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchList(q.trim()), 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* --------- Filtrage côté client (optionnel) ---------
     Si tu veux te reposer uniquement sur la recherche serveur,
     tu peux supprimer ce useMemo et afficher directement "data". */
  const filtered = useMemo(() => {
    // Ici on laisse tel quel: les résultats affichés sont ceux du serveur.
    return data;
  }, [data]);

  /* --------- Actions --------- */
  function onEdit(row) {
    // Redirection vers la page d’édition (tu l’as déjà)
    navigate(`/medicale/${row.id}/edit`, { state: { row } });
  }

  async function onDelete(row) {
    if (!window.confirm(`Supprimer les infos médicales de ${row.nom} ${row.prenoms} ?`)) return;

    // Optimistic UI : on retire la ligne tout de suite
    const prev = data;
    setData((list) => list.filter((x) => x.id !== row.id));
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/medicales/${row.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      // Optionnel: re-fetch pour refléter le total exact
      // await fetchList(q.trim());
    } catch (e) {
      // Rollback si échec
      setData(prev);
      alert(e.message || "Suppression impossible.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 text-slate-900 shadow-sm">
      {/* En-tête + recherche */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-dyn-title font-extrabold text-slate-900">Liste Médicale des Pèlerins</h2>
          <p className="text-dyn-sm text-slate-600">
            Toutes les informations médicales enregistrées (pouls, tension, groupe sanguin, etc.)
          </p>
          {loading && <p className="text-slate-500 text-sm mt-1">Chargement…</p>}
          {err && <p className="text-rose-600 text-sm mt-1">{err}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, passeport, CMAH...)"
            className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ======= Vue Mobile (cartes) ======= */}
      <div className="mt-6 grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-500">{loading ? "Chargement…" : "Aucune donnée trouvée."}</p>
        ) : (
          filtered.map((m) => (
            <article key={m.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="font-bold text-slate-900 text-base">
                {m.nom} {m.prenoms}
              </div>
              <div className="text-sm text-slate-600">
                Passeport: <span className="font-mono">{m.passeport}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                CMAH: {m.numeroCMAH}
                <Badge tone="blue">{m.groupeSanguin}</Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div>
                  <dt className="text-slate-500">Poids</dt>
                  <dd className="text-slate-800">{m.poids || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tension</dt>
                  <dd className="text-slate-800">{m.tension || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Diabète</dt>
                  <dd className="text-slate-800">{m.diabete || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cardiaque</dt>
                  <dd className="text-slate-800">{m.maladieCardiaque || "—"}</dd>
                </div>
              </dl>

              <div className="mt-3 flex justify-end gap-2">
                <ActionButton tone="primary" onClick={() => setSelected(m)}>
                  Détails
                </ActionButton>
                <ActionButton tone="edit" onClick={() => onEdit(m)}>
                  Modifier
                </ActionButton>
                <ActionButton tone="warn" onClick={() => onDelete(m)}>
                  Supprimer
                </ActionButton>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ======= Vue Desktop/Tablette (tableau) ======= */}
      <div className="mt-6 overflow-x-auto hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-slate-500">{loading ? "Chargement…" : "Aucune donnée médicale trouvée."}</p>
        ) : (
          <table className="min-w-[1280px] border-separate border-spacing-y-6 text-[14px]">
            <thead>
              <tr className="bg-blue-50 border border-blue-100">
                <Th>#</Th>
                <Th>CMAH</Th>
                <Th>Nom & Prénoms</Th>
                <Th>Passeport</Th>
                <Th>Groupe</Th>
                <Th>Poids</Th>
                <Th>Tension</Th>
                <Th>Pouls</Th>
                <Th>Diabète</Th>
                <Th>Cardiaque</Th>
                <Th>Covid</Th>
                <Th>Vulnérabilité</Th>
                <Th>Examens</Th>
                <Th>Antécédents</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className="bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                  <Td className="text-slate-500">{i + 1}</Td>
                  <Td className="font-medium">{m.numeroCMAH}</Td>
                  <Td className="font-semibold text-slate-900">
                    {m.nom} {m.prenoms}
                  </Td>
                  <Td className="font-mono text-slate-600">{m.passeport}</Td>
                  <Td>
                    <Badge tone="blue">{m.groupeSanguin || "—"}</Badge>
                  </Td>
                  <Td>{m.poids || "—"}</Td>
                  <Td>{m.tension || "—"}</Td>
                  <Td>{m.pouls || "—"}</Td>
                  <Td>{m.diabete || "—"}</Td>
                  <Td>{m.maladieCardiaque || "—"}</Td>
                  <Td>{m.covid || "—"}</Td>
                  <Td>{m.vulnerabilite || "—"}</Td>
                  <Td>{m.examenParaclinique || "—"}</Td>
                  <Td>{m.antecedents || "—"}</Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-2">
                      <ActionButton tone="primary" onClick={() => setSelected(m)}>
                        Détails
                      </ActionButton>
                      <ActionButton tone="edit" onClick={() => onEdit(m)}>
                        Modifier
                      </ActionButton>
                      <ActionButton tone="warn" onClick={() => onDelete(m)}>
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

      {/* ======= Modale de détails ======= */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-[min(900px,95vw)] max-h-[90vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">
                Détails Médicaux — {selected.nom} {selected.prenoms}
              </h3>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <DetailSection title="Informations de base">
                <Info label="CMAH" value={selected.numeroCMAH} />
                <Info label="Passeport" value={selected.passeport} />
                <Info label="Nom & Prénoms" value={`${selected.nom} ${selected.prenoms}`} />
                <Info label="Groupe sanguin" value={selected.groupeSanguin} />
              </DetailSection>

              <DetailSection title="Constantes médicales">
                <Info label="Poids" value={selected.poids} />
                <Info label="Tension" value={selected.tension} />
                <Info label="Pouls" value={selected.pouls} />
              </DetailSection>

              <DetailSection title="Santé générale">
                <Info label="Diabète" value={selected.diabete} />
                <Info label="Cardiaque" value={selected.maladieCardiaque} />
                <Info label="Covid-19" value={selected.covid} />
                <Info label="Vulnérabilité" value={selected.vulnerabilite} />
              </DetailSection>

              <DetailSection title="Examens et Observations">
                <Info label="Examens" value={selected.examenParaclinique} />
                <Info label="Antécédents" value={selected.antecedents} />
                <Info label="Accompagnements" value={selected.accompagnements} />
                <Info label="Analyse psychiatrique" value={selected.analysePsychiatrique} />
              </DetailSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================
   Sous-blocs (bleu & blanc)
========================== */
function DetailSection({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-blue-700">
        {title}
      </div>
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label} : </span>
      <span className="text-slate-900 font-medium">{value || "—"}</span>
    </div>
  );
}
