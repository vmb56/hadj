// src/pages/offres/EnregistrementOffres.jsx
import React, { useEffect, useMemo, useState } from "react";

/* -----------------------------------------------------------
   ENREGISTREMENT OFFRES — Thème bleu & blanc (connecté API)
   Back attendu (aligné avec ta route sequelize):
     GET    /api/offres            -> { items: [{ id, nom, prix, hotel, dateDepart, dateArrivee, ... }] }
     POST   /api/offres            -> { id, nom, prix, hotel, dateDepart, dateArrivee, ... }
     PUT    /api/offres/:id        -> { id, nom, prix, hotel, dateDepart, dateArrivee, ... }
     DELETE /api/offres/:id        -> { ok:true }
----------------------------------------------------------- */

/* ===== CONFIG API ===== */
const TOKEN_KEY = "bmvt_token";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * 🔗 API fixe en prod : https://hadjbackend.onrender.com
 * (si tu veux, tu pourras rebrancher VITE_API_URL au-dessus)
 */
const API_BASE = "https://hadjbackend.onrender.com";

/* ===== Helpers UI ===== */
const fmtMoney = (n) =>
  isNaN(Number(n)) ? "0" : Number(n).toLocaleString("fr-FR");

const toFR = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

/* ===== API ===== */
const api = {
  async list(search = "") {
    const url = new URL(`${API_BASE.replace(/\/+$/, "")}/api/offres`);
    if (search) url.searchParams.set("search", search);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      // 🔐 pas de cookies, comme AjoutMedicale
      credentials: "omit",
    }).catch((e) => {
      console.error("[offres] list network error:", e);
      throw new Error("Réseau/CORS: impossible de joindre l’API");
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.message || j?.error || msg;
      } catch {}
      throw new Error(msg);
    }

    const j = await res.json();
    return Array.isArray(j?.items) ? j.items : [];
  },

  async create(payload) {
    // payload attendu: { nom, prix, hotel, date_depart, date_arrivee }
    const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/api/offres`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: JSON.stringify(payload),
      credentials: "omit",
    }).catch((e) => {
      console.error("[offres] create network error:", e);
      throw new Error("Réseau/CORS: impossible de joindre l’API");
    });

    let j = null;
    try {
      j = await res.json();
    } catch {}

    if (!res.ok) throw new Error(j?.message || j?.error || `HTTP ${res.status}`);
    return j;
  },

  async update(id, payload) {
    const res = await fetch(
      `${API_BASE.replace(/\/+$/, "")}/api/offres/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: "omit",
      }
    ).catch((e) => {
      console.error("[offres] update network error:", e);
      throw new Error("Réseau/CORS: impossible de joindre l’API");
    });

    let j = null;
    try {
      j = await res.json();
    } catch {}

    if (!res.ok) throw new Error(j?.message || j?.error || `HTTP ${res.status}`);
    return j;
  },

  async remove(id) {
    const res = await fetch(
      `${API_BASE.replace(/\/+$/, "")}/api/offres/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        credentials: "omit",
      }
    ).catch((e) => {
      console.error("[offres] remove network error:", e);
      throw new Error("Réseau/CORS: impossible de joindre l’API");
    });

    if (!res.ok) {
      let j = null;
      try {
        j = await res.json();
      } catch {}
      throw new Error(j?.message || j?.error || `HTTP ${res.status}`);
    }
    return { ok: true };
  },
};

/* ===== Page ===== */
export default function EnregistrementOffres() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    id: null,
    nom: "",
    prix: "",
    hotel: "",
    dateDepart: "",
    dateArrivee: "",
  });

  const isEditing = form.id != null;

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const items = await api.list(q.trim());
      setRows(items);
    } catch (e) {
      setErr(e.message || "Échec du chargement");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []); // au montage

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "prix") {
      const v = value.replace(/\s/g, "");
      if (v === "" || /^\d+$/.test(v))
        setForm((f) => ({ ...f, prix: v }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  function validate(v) {
    const e = {};
    if (!v.nom) e.nom = "Nom de l’offre requis";
    if (!v.prix || Number(v.prix) <= 0) e.prix = "Prix invalide";
    if (!v.hotel) e.hotel = "Hôtel requis";
    if (!v.dateDepart) e.dateDepart = "Date de départ requise";
    if (!v.dateArrivee) e.dateArrivee = "Date d’arrivée requise";
    if (v.dateDepart && v.dateArrivee && v.dateArrivee < v.dateDepart) {
      e.dateArrivee = "La date d’arrivée doit être après la date de départ";
    }
    return e;
  }

  const resetForm = () =>
    setForm({
      id: null,
      nom: "",
      prix: "",
      hotel: "",
      dateDepart: "",
      dateArrivee: "",
    });

  const onRowClick = (r) => {
    // r vient déjà en camelCase de l’API: dateDepart/dateArrivee
    setForm({
      id: r.id,
      nom: r.nom || "",
      prix: String(r.prix ?? ""),
      hotel: r.hotel || "",
      dateDepart: (r.dateDepart || "").slice(0, 10),
      dateArrivee: (r.dateArrivee || "").slice(0, 10),
    });
  };

  async function onCreate() {
    if (saving) return;
    const e = validate(form);
    if (Object.keys(e).length) {
      alert(Object.values(e)[0]);
      return;
    }
    setSaving(true);
    try {
      await api.create({
        nom: form.nom.trim(),
        prix: Number(form.prix || 0),
        hotel: form.hotel.trim(),
        // Backend attend snake_case
        date_depart: form.dateDepart,
        date_arrivee: form.dateArrivee,
      });
      resetForm();
      await reload();
    } catch (e) {
      alert(e.message || "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate() {
    if (!isEditing || saving) return;
    const e = validate(form);
    if (Object.keys(e).length) {
      alert(Object.values(e)[0]);
      return;
    }
    setSaving(true);
    try {
      await api.update(form.id, {
        nom: form.nom.trim(),
        prix: Number(form.prix || 0),
        hotel: form.hotel.trim(),
        date_depart: form.dateDepart,
        date_arrivee: form.dateArrivee,
      });
      resetForm();
      await reload();
    } catch (e) {
      alert(e.message || "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!isEditing || saving) return;
    if (!window.confirm("Supprimer cette offre ?")) return;
    setSaving(true);
    try {
      await api.remove(form.id);
      resetForm();
      await reload();
    } catch (e) {
      alert(e.message || "Suppression impossible");
    } finally {
      setSaving(false);
    }
  }

  const tableRows = useMemo(
    () => [...rows].sort((a, b) => (a.id || 0) - (b.id || 0)),
    [rows]
  );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-blue-700">
          ENREGISTREMENT DES OFFRES
        </h1>
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de l’offre">
            <input
              name="nom"
              value={form.nom}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
              placeholder="OPTION 1"
            />
          </Field>

          <Field label="Prix de l’offre (FCFA)">
            <div className="flex items-center gap-2">
              <input
                name="prix"
                inputMode="numeric"
                value={form.prix}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 font-mono"
                placeholder="5350000"
              />
              <span className="text-sm text-slate-600">FCFA</span>
            </div>
          </Field>

          <Field label="Hôtel">
            <input
              name="hotel"
              value={form.hotel}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
              placeholder="HOTEL RIYAD DEEFAH"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date de départ">
              <input
                type="date"
                name="dateDepart"
                value={form.dateDepart}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
              />
            </Field>
            <Field label="Date d’arrivée">
              <input
                type="date"
                name="dateArrivee"
                value={form.dateArrivee}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <Button tone="primary" onClick={onCreate}>
              {saving ? "Enregistrement…" : "VALIDER"}
            </Button>
          ) : (
            <>
              <Button tone="primary" onClick={onUpdate}>
                {saving ? "Mise à jour…" : "MODIFIER"}
              </Button>
              <Button tone="warn" onClick={onDelete}>
                {saving ? "Suppression…" : "SUPPRIMER"}
              </Button>
              <Button onClick={resetForm}>NOUVEAU</Button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, hôtel)…"
              className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-blue-300"
              onKeyDown={(e) => {
                if (e.key === "Enter") reload();
              }}
            />
            <Button onClick={reload}>Rechercher</Button>
          </div>
        </div>

        {loading && (
          <p className="text-slate-500 text-sm mt-2">Chargement…</p>
        )}
        {err && (
          <div className="text-rose-600 text-sm mt-2">
            {err}
            <div className="text-[11px] text-slate-500 mt-1">
              API_BASE:{" "}
              <span className="font-mono">{API_BASE}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tableau des offres */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-[14px]">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <Th>IDENTIFIANT OFFRE</Th>
                <Th>NOM OFFRE</Th>
                <Th>PRIX OFFRE</Th>
                <Th>HÔTEL</Th>
                <Th>DATE DÉPART</Th>
                <Th>DATE ARRIVÉE</Th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 transition cursor-pointer border-t border-slate-100"
                  onClick={() => onRowClick(r)}
                  title="Cliquer pour charger l’offre dans le formulaire"
                >
                  <Td className="text-slate-500">{r.id}</Td>
                  <Td className="font-medium text-slate-900">{r.nom}</Td>
                  <Td className="font-mono">
                    {fmtMoney(r.prix)} FCFA
                  </Td>
                  <Td className="text-slate-700">{r.hotel}</Td>
                  <Td className="text-slate-700">
                    {toFR((r.dateDepart || "").slice(0, 10))}
                  </Td>
                  <Td className="text-slate-700">
                    {toFR((r.dateArrivee || "").slice(0, 10))}
                  </Td>
                </tr>
              ))}
              {tableRows.length === 0 && !loading && (
                <tr>
                  <Td colSpan={6} className="text-center text-slate-500 py-6">
                    Aucune offre enregistrée.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------ UI helpers (Thème bleu & blanc) ------------ */
function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      <span className="text-[12px] font-semibold text-blue-700">
        {label}
      </span>
      {children}
    </div>
  );
}

function Button({ children, tone = "default", className = "", ...props }) {
  const styles = {
    default:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    primary:
      "border border-transparent bg-blue-600 text-white hover:bg-blue-700",
    warn: "border border-transparent bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button
      type="button"
      {...props}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${styles[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

function Th({ children }) {
  return (
    <th className="text-left px-4 py-3 text-[12px] uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 align-middle whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}
