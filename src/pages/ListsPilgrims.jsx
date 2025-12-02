// src/pages/ListsPilgrims.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Printer, Users, Search, X } from "lucide-react";

/* ======================= Connexion API commune ======================= */
const API_BASE = "https://hadjbackend.onrender.com".replace(/\/+$/, "");
const TOKEN_KEY = "bmvt_token";
const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

async function http(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok)
    throw new Error(
      typeof data === "string" ? data : data?.message || `HTTP ${res.status}`
    );
  return data;
}

/* ============================== API ENDPOINTS (Pèlerins uniquement) ============================== */
const EP = {
  PELERINS: (search) =>
    `/api/pelerins${search ? `?search=${encodeURIComponent(search)}` : ""}`,
  BY_PASSPORT: (passport) =>
    `/api/pelerins/by-passport?passport=${encodeURIComponent(passport)}`,
};

/* ============================== Normalizers ================================ */
const normPilgrim = (r = {}) => ({
  id: r.id,
  nom: r.nom || "",
  prenoms: r.prenoms || "",
  sexe: (r.sexe || "").toUpperCase() === "F" ? "F" : "H", // backend M/F → H/F
  passeport: r.num_passeport || r.numPasseport || "",
});
const normList = (r = {}) => ({
  id: r.id,
  nom: r.nom || "",
  date: (r.date || "").slice(0, 10),
  sexe: ["H", "F", "T"].includes((r.sexe || "H").toUpperCase())
    ? (r.sexe || "H").toUpperCase()
    : "H",
  pilgrims: Array.isArray(r.pilgrims) ? r.pilgrims.map(normPilgrim) : [],
});

/* ================================= Page =================================== */
export default function ListsPilgrims() {
  // Listes 100% FRONT
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Bandeau + création
  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({
    nom: "",
    date: todayISO(),
    sexe: "H",
  });

  // Modale gestion
  const [manage, setManage] = useState({ open: false, list: null });

  // Total pèlerins côté serveur (uniquement pour le KPI)
  const [totalPelerins, setTotalPelerins] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await http(EP.PELERINS(""));
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setTotalPelerins(items.length);
      } catch (e) {
        setErr(e.message || "Impossible de charger les pèlerins");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Création FRONT-ONLY
  function createList(e) {
    e.preventDefault();
    if (!newForm.nom) return;
    const localId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const newList = {
      id: localId,
      nom: newForm.nom.trim(),
      date: newForm.date,
      sexe: newForm.sexe, // "H" | "F" | "T"
      pilgrims: [],
    };
    setLists((arr) => [newList, ...arr]);
    setOpenNew(false);
    setNewForm({ nom: "", date: todayISO(), sexe: "H" });
  }

  // Suppression FRONT-ONLY
  function removeList(id) {
    if (!window.confirm("Supprimer cette liste ?")) return;
    setLists((a) => a.filter((x) => x.id !== id));
  }

  const EmptyState = (
    <div className="rounded-2xl border border-sky-100 bg-white shadow-sm p-6 fade-in">
      <div className="rounded-2xl border-2 border-dashed border-slate-200/80 bg-gradient-to-b from-white to-sky-50/40 min-h-[440px] flex items-center justify-center">
        <div className="text-center max-w-xl mx-auto px-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-sky-100 ring-1 ring-sky-200 flex items-center justify-center pulse-ring">
            <Users className="h-7 w-7 text-sky-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900">
            Aucune liste créée
          </div>
          <p className="mt-1 text-slate-600">
            Commencez par créer votre première liste de pèlerins pour
            organiser
            <br />
            vos évènements
          </p>
          <button
            onClick={() => setOpenNew(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#143C7D] px-4 py-2 text-white font-semibold shadow-sm hover:brightness-110 btn-press"
          >
            <Plus className="h-4 w-4" /> Créer ma première liste
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-dyn slide-up">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="fade-in">
          <h1 className="text-[34px] leading-tight md:text-[38px] font-extrabold text-slate-900">
            Gestion des Listes de Pèlerins
          </h1>
          <p className="mt-1 text-slate-600">
            Créez et gérez vos listes de pèlerins pour vos événements
          </p>
        </div>
        <button
          onClick={() => setOpenNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#143C7D] px-4 py-2 text-white font-semibold shadow-sm hover:brightness-110 hover-lift btn-press"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white/20 mr-0.5">
            <Plus className="h-4 w-4" />
          </span>
          Nouvelle Liste
        </button>
      </div>

      {/* BANDEAU STATS */}
      <div
        className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/80 to-white shadow-sm px-6 py-5 fade-in"
        style={{ boxShadow: "0 1px 0 rgba(15,23,42,0.04)" }}
      >
        <div className="grid grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-slate-600">Pèlerins enregistrés</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {totalPelerins}
              </div>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-slate-600">Listes créées</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {lists.length}
            </div>
          </div>
        </div>
        {loading && (
          <div className="text-xs text-slate-500 mt-2 shimmer">
            Chargement…
          </div>
        )}
        {err && <div className="text-xs text-rose-600 mt-2">{err}</div>}
      </div>

      {/* CONTENU */}
      {!lists.length && !loading ? (
        EmptyState
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists.map((l) => (
            <ListCard
              key={l.id}
              list={l}
              onManage={() => setManage({ open: true, list: l })}
              onPrint={() => printList(l)}
              onDelete={() => removeList(l.id)}
            />
          ))}
        </section>
      )}

      {/* Modale création (front-only) */}
      {openNew && (
        <Modal title="Nouvelle liste" onClose={() => setOpenNew(false)}>
          <form onSubmit={createList} className="space-y-3">
            <Labelled label="Intitulé de la liste">
              <input
                className="input"
                value={newForm.nom}
                onChange={(e) =>
                  setNewForm((s) => ({ ...s, nom: e.target.value }))
                }
                placeholder="ex: formation"
                required
              />
            </Labelled>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Labelled label="Date">
                <input
                  type="date"
                  className="input"
                  value={newForm.date}
                  onChange={(e) =>
                    setNewForm((s) => ({ ...s, date: e.target.value }))
                  }
                  required
                />
              </Labelled>
              <Labelled label="Genre">
                <select
                  className="input"
                  value={newForm.sexe}
                  onChange={(e) =>
                    setNewForm((s) => ({ ...s, sexe: e.target.value }))
                  }
                >
                  <option value="H">Hommes</option>
                  <option value="F">Femmes</option>
                  <option value="T">Tous</option>
                </select>
              </Labelled>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpenNew(false)}
                className="btn-outline btn-press"
              >
                Annuler
              </button>
              <button type="submit" className="btn-blue btn-press">
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale gestion pèlerins */}
      <ManageModal
        open={manage.open}
        list={manage.list}
        onClose={() => setManage({ open: false, list: null })}
        onSaved={(updated) => {
          setLists((arr) =>
            arr.map((x) => (x.id === updated.id ? updated : x))
          );
          setManage({ open: false, list: null });
        }}
      />

      {/* Styles utilitaires + animations (thème bleu clair) */}
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-sky-400 transition; }
        .btn-blue { @apply inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition; }
        .btn-outline { @apply inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition; }

        /* Animations */
        @keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
        .fade-in{animation:fadeIn .5s ease both}
        @keyframes slideUp{0%{transform:translateY(12px);opacity:.0}100%{transform:translateY(0);opacity:1}}
        .slide-up{animation:slideUp .45s ease both}
        .hover-lift{transition:transform .18s ease, box-shadow .18s ease}
        .hover-lift:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(30,64,175,.15)}
        .btn-press:active{transform:translateY(1px)}
        @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(14,165,233,.35)}70%{box-shadow:0 0 0 12px rgba(14,165,233,0)}100%{box-shadow:0 0 0 0 rgba(14,165,233,0)}}
        .pulse-ring{animation:ringPulse 1.6s ease-out infinite}
        .shimmer{position:relative;overflow:hidden}
        .shimmer::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,rgba(242,244,247,0) 0%,rgba(191,219,254,.6) 40%,rgba(242,244,247,0) 80%);animation:sh 1.5s linear infinite}
        @keyframes sh{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
      `}</style>
    </div>
  );
}

/* ========================= Manage (Modal) ========================= */
function ManageModal({ open, list, onClose, onSaved }) {
  const [search, setSearch] = useState("");
  const [avail, setAvail] = useState([]); // tous les pèlerins affichables
  const [picked, setPicked] = useState(new Set()); // ids cochés
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !list) return;
    setErr("");
    setSearch("");
    setPicked(new Set((list.pilgrims || []).map((p) => p.id)));

    (async () => {
      setLoading(true);
      try {
        const data = await http(`/api/pelerins`);
        const raw = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        let rows = raw.map(normPilgrim);
        if (list.sexe === "F") rows = rows.filter((p) => p.sexe === "F");
        if (list.sexe === "H") rows = rows.filter((p) => p.sexe === "H");
        setAvail(rows);
      } catch (e) {
        setErr(e.message || "Impossible de charger les pèlerins");
        setAvail([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, list]);

  useEffect(() => {
    if (!open || !list) return;
    const timer = setTimeout(async () => {
      try {
        setErr("");
        setLoading(true);
        const url = search.trim()
          ? EP.PELERINS(search.trim())
          : EP.PELERINS("");
        const data = await http(url);
        const raw = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        let rows = raw.map(normPilgrim);
        if (list.sexe === "F") rows = rows.filter((p) => p.sexe === "F");
        if (list.sexe === "H") rows = rows.filter((p) => p.sexe === "H");
        setAvail(rows);
      } catch (e) {
        setErr(e.message || "Erreur de recherche");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return avail;
    return avail.filter(
      (p) =>
        (p.nom || "").toLowerCase().includes(q) ||
        (p.prenoms || "").toLowerCase().includes(q) ||
        (p.passeport || "").toLowerCase().includes(q)
    );
  }, [avail, search]);

  function toggle(id) {
    setPicked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll(check) {
    if (check) setPicked(new Set(filtered.map((p) => p.id)));
    else setPicked(new Set());
  }
  function save() {
    if (!list) return;
    const selected = avail.filter((p) => picked.has(p.id));
    const updated = { ...list, pilgrims: selected };
    onSaved?.(updated); // FRONT-ONLY
  }

  if (!open || !list) return null;

  const selectedCount = picked.size;
  const totalCount = filtered.length;

  return (
    <Modal title={`Gérer les pèlerins — ${list.nom}`} onClose={onClose}>
      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-8"
            placeholder="Rechercher (nom, prénoms, passeport, contact)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Compteurs + actions groupées */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2 text-slate-700 text-sm font-semibold flex items-center gap-3 fade-in">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
            👤
          </span>
          <span>{selectedCount} sélectionné(s)</span>
          <span className="ml-2 text-slate-500">
            / {totalCount} affiché(s)
          </span>
          {loading && (
            <span className="ml-2 text-xs text-slate-500 shimmer">
              Chargement…
            </span>
          )}
          {err && (
            <span className="ml-2 text-xs text-rose-600">{err}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleAll(true)}
          className="btn-outline px-3 py-2 text-sm btn-press"
        >
          Tout sélectionner
        </button>
        <button
          type="button"
          onClick={() => toggleAll(false)}
          className="btn-outline px-3 py-2 text-sm btn-press"
        >
          Tout désélectionner
        </button>
      </div>

      {/* Liste scrollable */}
      <div className="mt-3 max-h-[52vh] overflow-y-auto space-y-2">
        {filtered.map((p) => {
          const checked = picked.has(p.id);
          return (
            <label
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                checked
                  ? "bg-slate-100 border-slate-300"
                  : "bg-white border-slate-200"
              } cursor-pointer fade-in`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800">
                    {p.nom} {p.prenoms}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.passeport || "—"}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs rounded-full px-2.5 py-1 ${
                  p.sexe === "F"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {p.sexe === "F" ? "femme" : "homme"}
              </span>
            </label>
          );
        })}
        {!loading && !filtered.length && (
          <div className="text-sm text-slate-500">Aucun pèlerin</div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="btn-outline btn-press" onClick={onClose}>
          Annuler
        </button>
        <button className="btn-blue btn-press" onClick={save}>
          Enregistrer ({selectedCount})
        </button>
      </div>
    </Modal>
  );
}

/* =========================== Carte de liste =========================== */
function ListCard({ list, onManage, onPrint, onDelete }) {
  const first = list.pilgrims?.slice(0, 6) || [];

  const chip =
    list.sexe === "F"
      ? { txt: "Femmes", cls: "bg-rose-100 text-rose-700" }
      : list.sexe === "T"
      ? { txt: "Tous", cls: "bg-slate-100 text-slate-700" }
      : { txt: "Hommes", cls: "bg-sky-100 text-sky-700" };

  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm hover-lift fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">
            {list.nom || "Sans titre"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {formatDateFR(list.date)}
          </div>
        </div>
        <span className={`text-xs rounded-full px-2 py-1 ${chip.cls}`}>
          {chip.txt}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2">
        <div className="text-sm text-slate-700 font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-700" /> Pèlerins inscrits
          <span className="ml-auto font-extrabold text-slate-900">
            {list.pilgrims?.length || 0}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1 max-h-40 overflow-auto pr-1">
        <div className="text-sm text-slate-600">Liste des pèlerins :</div>
        {first.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="text-slate-800">
                {p.nom} {p.prenoms}
              </span>
            </div>
            <span
              className={`text-[11px] rounded-full px-2 py-0.5 ${
                p.sexe === "F"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              {p.sexe === "F" ? "femme" : "homme"}
            </span>
          </div>
        ))}
        {!first.length && (
          <div className="text-sm text-slate-500">Aucun pèlerin</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onManage}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:brightness-110 btn-press"
        >
          <Users className="h-4 w-4" /> Gérer les pèlerins
        </button>
        <button
          title="Imprimer"
          onClick={onPrint}
          className="rounded-xl border border-slate-300 bg-white p-2 hover:bg-slate-50 btn-press"
        >
          <Printer className="h-4 w-4 text-slate-700" />
        </button>
        <button
          title="Supprimer"
          onClick={onDelete}
          className="rounded-xl bg-rose-600 p-2 text-white hover:brightness-110 btn-press"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================== Impression (style maquette) ============================== */
function printList(list) {
  const now = new Date();
  const genre =
    list.sexe === "F" ? "Femmes" : list.sexe === "T" ? "Tous" : "Hommes";

  const css = `
    :root { --blue:#1e40af; --muted:#6b7280; }
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:28px;color:#0b1220}
    h1{font-size:28px;margin:0 0 8px 0;font-weight:900;text-align:center;color:var(--blue)}
    .sub{display:flex;gap:10px;align-items:center;justify-content:center;color:#0b1220;font-size:13px;margin-bottom:6px}
    .chip{font-size:12px;border:1px solid #c7d2fe;color:#1e40af;border-radius:999px;padding:2px 10px;display:inline-block}
    hr{border:none;border-top:3px solid #3b82f6;margin:16px 0 22px}
    .kpiTitle{color:#6b7280;text-align:center;margin-top:6px}
    .kpiVal{font-size:38px;color:#1e40af;font-weight:800;text-align:center;margin-top:6px}
    table{width:100%;border-collapse:collapse;margin-top:22px;font-size:14px}
    thead th{color:#9ca3af;text-align:left;padding:10px 12px;border-bottom:1px solid #e5e7eb}
    td{padding:12px;border-bottom:1px solid #e5e7eb}
    tfoot td{color:#6b7280;font-size:12px;text-align:center;border:none;padding-top:20px}
    @page{size:A4;margin:12mm}
  `;

  const rows = (list.pilgrims || [])
    .map(
      (p, i) => `<tr>
      <td style="width:40px">${i + 1}</td>
      <td>${escapeHtml(p.nom)} ${escapeHtml(p.prenoms)}</td>
      <td style="width:120px">${p.sexe === "F" ? "Femme" : "Homme"}</td>
    </tr>`
    )
    .join("");

  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  w.document.write(`
    <html><head><title>${escapeHtml(list.nom)}</title><style>${css}</style></head>
    <body>
      <h1>${escapeHtml(list.nom)}</h1>
      <div class="sub">
        <span>📅 ${escapeHtml(formatDateFR(list.date))}</span>
        <span class="chip">${genre}</span>
      </div>
      <hr/>
      <div class="kpiTitle">Nombre total de pèlerins</div>
      <div class="kpiVal">${list.pilgrims?.length || 0}</div>

      <table>
        <thead><tr><th>#</th><th>Nom du Pèlerin</th><th>Genre</th></tr></thead>
        <tbody>${
          rows || `<tr><td colspan="3">Aucun pèlerin</td></tr>`
        }</tbody>
        <tfoot><tr><td colspan="3">Imprimé le ${now.toLocaleDateString(
          "fr-FR"
        )} à ${now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}</td></tr></tfoot>
      </table>
      
      <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  w.document.close();
}

/* ============================== UI helpers ============================== */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 w-[min(720px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-sky-100 bg-white p-5 shadow-2xl"
        style={{ animation: "slideUp .35s ease both" }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 btn-press"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
function Labelled({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function formatDateFR(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}
