// src/pages/Voyages.jsx
import React, { useState, useEffect, useCallback } from "react";

/* =========================================================================
   CONFIG API
   ========================================================================= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* =========================================================================
   FETCH helper
   ========================================================================= */
async function apiFetch(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/* =========================================================================
   Normalisation
   ========================================================================= */
function normalizeRow(r = {}) {
  const id = r.id ?? r._id ?? r.voyage_id ?? r.ID ?? null;
  const nom = (r.nom ?? r.NOM ?? "").toString().toUpperCase().trim();
  const anneeNum = Number(r.annee ?? r.ANNEE);
  const offres = (r.offres ?? r.OFFRES ?? "").toString();
  return {
    id: id != null ? String(id) : null,
    nom,
    annee: Number.isFinite(anneeNum) ? anneeNum : null,
    offres,
    created_at: r.created_at ?? r.createdAt ?? null,
    updated_at: r.updated_at ?? r.updatedAt ?? null,
  };
}

/* =========================================================================
   APPELS API VOYAGES
   ========================================================================= */
async function listVoyagesAPI() {
  const out = await apiFetch(`/api/voyages`);
  const arr = Array.isArray(out?.items) ? out.items : Array.isArray(out) ? out : [];
  return arr.map(normalizeRow);
}
async function createVoyageAPI(payload) {
  const data = await apiFetch(`/api/voyages`, { method: "POST", body: payload });
  return normalizeRow(data);
}
async function updateVoyageAPI(id, payload) {
  const data = await apiFetch(`/api/voyages/${id}`, { method: "PUT", body: payload });
  return normalizeRow(data);
}
async function deleteVoyageAPI(id) {
  return apiFetch(`/api/voyages/${id}`, { method: "DELETE" });
}

/* =========================================================================
   REACT BITS — Typo + Boutons (theme unifié)
   ========================================================================= */
const RB = {
  H1: ({ children, className = "" }) => (
    <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 ${className}`}>{children}</h1>
  ),
  H2: ({ children, className = "" }) => (
    <h2 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h2>
  ),
  Label: ({ children, className = "" }) => (
    <span className={`text-xs font-semibold text-slate-600 ${className}`}>{children}</span>
  ),
  Muted: ({ children, className = "" }) => (
    <p className={`text-xs text-slate-500 ${className}`}>{children}</p>
  ),
};

// Variants: primary | outline | danger | mini | miniDanger | ghost
function Button({ variant = "primary", className = "", disabled, children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = "px-4 py-2 text-sm";
  const miniSizes = "px-3 py-1.5 text-sm rounded-lg";

  const variants = {
    primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    mini: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    miniDanger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  const sizeClass = variant.startsWith("mini") ? miniSizes : sizes;
  return (
    <button
      className={`${base} ${sizeClass} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

/* =========================================================================
   PAGE : Formulaire + Liste + Modales + Toasts
   ========================================================================= */
export default function Voyages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Formulaire
  const [editingId, setEditingId] = useState(null); // string | null
  const [form, setForm] = useState(emptyForm());

  // Toasts
  const [toasts, setToasts] = useState([]); // {id, type: 'success'|'error'|'info', message}

  // Modale de confirmation
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmer",
    cancelText: "Annuler",
    onConfirm: null,
  });

  const showToast = useCallback((message, type = "info", ttl = 3500) => {
    const id = String(Math.random());
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl);
  }, []);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const items = await listVoyagesAPI();
      setRows(items);
    } catch (e) {
      setRows([]);
      setErr(e.message || "Échec du chargement");
      showToast(e.message || "Échec du chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    const payload = normalizePayload(form);
    if (!payload.nom || !payload.annee) return;

    try {
      if (editingId) {
        await updateVoyageAPI(editingId, payload);
        showToast("Voyage modifié avec succès.", "success");
      } else {
        await createVoyageAPI(payload);
        showToast("Voyage ajouté avec succès.", "success");
      }
      await reload();
      resetForm();
    } catch (error) {
      if (error.status === 409) {
        showToast("Ce voyage existe déjà (même nom et même année).", "error");
      } else if (error.status === 400) {
        showToast(error.message || "Requête invalide.", "error");
      } else if (error.status === 401) {
        showToast("Session expirée. Merci de te reconnecter.", "error");
      } else if (error.status === 403) {
        showToast("Accès refusé.", "error");
      } else {
        showToast(error.message || "Échec de l’enregistrement.", "error");
      }
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({ nom: row.nom, annee: String(row.annee), offres: row.offres || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function askRemove(row) {
    setConfirm({
      open: true,
      title: "Supprimer le voyage",
      message: `Confirmer la suppression de "${row.nom}" (${row.annee}) ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      onConfirm: () => doRemove(row),
    });
  }

  async function doRemove(row) {
    try {
      await deleteVoyageAPI(row.id);
      await reload();
      showToast("Voyage supprimé.", "success");
    } catch (error) {
      if (error.status === 401) {
        showToast("Session expirée. Merci de te reconnecter.", "error");
      } else if (error.status === 403) {
        showToast("Accès refusé.", "error");
      } else if (error.status === 404) {
        showToast("Voyage introuvable.", "error");
      } else {
        showToast(error.message || "Suppression impossible.", "error");
      }
    } finally {
      setConfirm((c) => ({ ...c, open: false }));
    }
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 rounded-t-2xl" />
        <div className="p-5 md:p-6">
          <RB.H1>VOYAGES</RB.H1>
          {err && <div className="mt-2 text-rose-600 text-sm">{err}</div>}
        </div>
      </div>

      {/* Formulaire */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
        <RB.H2 className="mb-3">{editingId ? "Modifier un voyage" : "Ajouter un voyage"}</RB.H2>

        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={<RB.Label>Nom du voyage</RB.Label>}>
              <select
                className="input"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              >
                <option value="HAJJ">HAJJ</option>
                <option value="OUMRAH">OUMRAH</option>
              </select>
            </Field>

            <Field label={<RB.Label>Année</RB.Label>}>
              <input
                type="number"
                className="input"
                min={2000}
                max={2100}
                value={form.annee}
                onChange={(e) => setForm({ ...form, annee: e.target.value })}
                placeholder="2025"
                required
              />
            </Field>
          </div>

          <Field label={<RB.Label>Offres</RB.Label>}>
            <textarea
              className="input min-h-[90px]"
              value={form.offres}
              onChange={(e) => setForm({ ...form, offres: e.target.value })}
              placeholder="Ex: Pack Standard, Hébergement 3*, Transport inclus..."
            />
          </Field>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                Annuler l’édition
              </Button>
            )}
          </div>

          
        </form>
      </section>

      {/* Liste */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <Th className="w-[220px]">IDENTIFIANT</Th>
                <Th className="w-[160px]">NOM</Th>
                <Th className="w-[140px]">ANNÉE</Th>
                <Th>OFFRES</Th>
                <Th className="w-[220px] text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    {loading ? "Chargement…" : "Aucun voyage."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id ?? Math.random()} className="hover:bg-slate-50 align-top">
                    <Td>
                      <div className="inline-flex items-center gap-2 font-semibold">
                        <span className="inline-grid h-6 w-6 place-items-center rounded bg-blue-600 text-white text-xs">
                          {String(r.id || "").slice(-2) || "--"}
                        </span>
                        <span>{r.nom}</span>
                      </div>
                    </Td>
                    <Td className="font-semibold">{r.nom}</Td>
                    <Td className="font-mono">{r.annee}</Td>
                    <Td title={r.offres || ""}>
                      {truncate(r.offres || "", 100)}
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2 pr-1">
                        <Button variant="mini" onClick={() => startEdit(r)} disabled={loading}>
                          Modifier
                        </Button>
                        <Button variant="miniDanger" onClick={() => askRemove(r)} disabled={loading}>
                          Supprimer
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Version mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id ?? Math.random()} className="px-4 py-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.nom}</span>
                <span className="font-mono text-slate-600">{r.annee}</span>
              </div>
              {r.offres ? (
                <div className="mt-1 text-xs text-slate-700">
                  {truncate(r.offres, 140)}
                </div>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button variant="mini" onClick={() => startEdit(r)} disabled={loading}>
                  Modifier
                </Button>
                <Button variant="miniDanger" onClick={() => askRemove(r)} disabled={loading}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}

          {!rows.length && !loading && (
            <div className="px-4 py-6 text-center text-slate-500">Aucun voyage.</div>
          )}
        </div>
      </section>

      {/* Modale de Confirmation */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
      />

      {/* Styles utilitaires Tailwind via @apply */}
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-400; }
        th { @apply text-left; }
      `}</style>
    </div>
  );
}

/* ================= UI Bits ================= */
function Th({ children, className = "" }) {
  return <th className={`px-3 py-3 text-left text-xs font-extrabold uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-3 text-slate-800 ${className}`}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      {label}
      {children}
    </label>
  );
}

/* ================= Helpers ================= */
function emptyForm() {
  return { nom: "HAJJ", annee: String(new Date().getFullYear()), offres: "" };
}
function normalizePayload(f) {
  const nom = (f.nom || "").toUpperCase().trim();
  const year = Number(String(f.annee || "").trim());
  const offres = String(f.offres || "").trim();
  return { nom, annee: Number.isFinite(year) ? year : new Date().getFullYear(), offres };
}
function truncate(str, n = 100) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

/* ================= Toasts ================= */
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed right-3 top-3 z-[60] space-y-2 w-full max-w-xs">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-sm text-sm flex items-start gap-3
            ${t.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
              t.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" :
              "bg-slate-50 border-slate-200 text-slate-800"}`}
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5">
            {t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}
          </span>
          <div className="flex-1">{t.message}</div>
          <button
            onClick={() => onClose?.(t.id)}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/* ================= Confirm Dialog ================= */
function ConfirmDialog({ open, title, message, confirmText = "Confirmer", cancelText = "Annuler", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <Button variant="ghost" className="rounded-md px-2 py-1" onClick={onCancel} aria-label="Fermer">✕</Button>
        </div>
        <p className="mt-3 text-slate-700 whitespace-pre-wrap">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
