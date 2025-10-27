// src/pages/utilisateurs/ListeUtilisateurs.jsx
import React, { useEffect, useMemo, useState } from "react";

/* ================== Config API (sans service) ================== */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_API_URL || process.env.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/* ===== appels directs au backend ===== */
async function listUsersAPI({ search = "" } = {}) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/users${qs}`); // -> { items: [...] }
}
async function updateUserAPI(id, payload) {
  return apiFetch(`/api/users/${id}`, { method: "PUT", body: payload });
}
async function deleteUserAPI(id) {
  return apiFetch(`/api/users/${id}`, { method: "DELETE" });
}

/* ====== mini-toasts ====== */
function useToasts() {
  const [toasts, set] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    set((a) => [...a, { id, ...t }]);
    setTimeout(() => set((a) => a.filter((x) => x.id !== id)), t.timeout ?? 3000);
  };
  const Node = () => (
    <div className="fixed right-4 top-4 z-[70] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl border px-4 py-3 w-[min(92vw,380px)] bg-white/90 backdrop-blur shadow-lg ${
            t.tone === "error" ? "border-rose-200" : "border-blue-200"
          }`}
        >
          <div className="font-semibold text-slate-900">{t.title}</div>
          {t.desc ? <div className="text-sm text-slate-600">{t.desc}</div> : null}
        </div>
      ))}
    </div>
  );
  return { push, Toasts: Node };
}

/* ===== helpers ===== */
function normalize(u) {
  return {
    id: u.id ?? u._id,
    nom: u.name ?? u.nom ?? "",
    email: u.email ?? "",
    role: u.role ?? "Agent",
    dernierLogin: u.lastSeenAt ?? u.lastLoginAt ?? u.lastLogin ?? u.dernierLogin ?? null,
  };
}
function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(dt);
  } catch {
    return "—";
  }
}

export default function ListeUtilisateurs() {
  const { push, Toasts } = useToasts();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  async function fetchUsers(search = q.trim()) {
    setLoading(true);
    setFetchError("");
    try {
      const data = await listUsersAPI({ search });
      const items = Array.isArray(data?.items) ? data.items : [];
      setRows(items.map(normalize));
    } catch (err) {
      setFetchError(err?.message || "Échec du chargement");
      push({ tone: "error", title: "Erreur", desc: "Impossible de charger les utilisateurs." });
      console.error("GET /api/users failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) fetchUsers(q.trim());
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((u) => `${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(s));
  }, [q, rows]);

  async function saveEditedUser(data) {
    const payload = {
      name: data.nom.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
    };

    try {
      await updateUserAPI(data.id, payload);
      setEditing(null);
      push({ title: "Utilisateur mis à jour" });
      await fetchUsers();
    } catch (err) {
      console.error("PUT /api/users/:id failed:", err);
      if (err.status === 401) {
        push({ tone: "error", title: "Non authentifié", desc: "Reconnecte-toi pour continuer." });
      } else if (err.status === 403) {
        push({ tone: "error", title: "Accès refusé", desc: "Ton rôle ne permet pas d’éditer." });
      } else if (err.status === 409) {
        push({ tone: "error", title: "Email déjà utilisé", desc: "Choisis un autre email." });
      } else if (err.status === 404) {
        push({ tone: "error", title: "Utilisateur introuvable" });
      } else {
        push({ tone: "error", title: "Échec de mise à jour", desc: err?.message || "Réessaie." });
      }
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Supprimer l’utilisateur “${user.nom}” ?`)) return;

    const prev = rows;
    setRows((r) => r.filter((u) => u.id !== user.id));

    try {
      await deleteUserAPI(user.id);
      push({ title: "Utilisateur supprimé" });
      await fetchUsers();
    } catch (err) {
      console.error("DELETE /api/users/:id failed:", err);
      setRows(prev);
      if (err.status === 401) {
        push({ tone: "error", title: "Non authentifié", desc: "Reconnecte-toi pour continuer." });
      } else if (err.status === 403) {
        push({ tone: "error", title: "Accès refusé", desc: "Ton rôle ne permet pas de supprimer." });
      } else if (err.status === 404) {
        push({ tone: "error", title: "Utilisateur introuvable" });
      } else {
        push({ tone: "error", title: "Suppression impossible", desc: err?.message || "Réessaie." });
      }
    }
  }

  return (
    <div className="text-dyn">
      <Toasts />

      {/* En-tête */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-dyn-title font-extrabold text-slate-900">Liste des utilisateurs</h3>
            <p className="text-dyn-sm text-slate-600">Rechercher et gérer les comptes.</p>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Recherche (nom, mail, rôle)"
            className="w-full md:w-72 rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
          />
        </div>

        {loading && <div className="mt-3 text-slate-500 text-dyn-sm">Chargement…</div>}
        {fetchError && <div className="mt-2 text-rose-600 text-dyn-sm">{fetchError}</div>}
      </div>

      {/* Cartes mobiles */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-500">{loading ? "Chargement…" : "Aucun résultat."}</p>
        ) : (
          filtered.map((u) => (
            <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{u.nom}</div>
                <div className="text-xs text-slate-600 truncate">{u.email}</div>
                <div className="mt-1 text-xs text-slate-600">
                  Rôle : <span className="font-semibold text-blue-700">{u.role}</span>
                </div>
              </div>

              <div className="mt-2 text-[12px] text-slate-600">
                Dernière connexion : <span className="text-slate-800">{formatDate(u.dernierLogin)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Btn onClick={() => setEditing(u)}>Modifier</Btn>
                <Btn tone="warn" onClick={() => deleteUser(u)}>
                  Supprimer
                </Btn>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Tableau desktop */}
      {!loading && (
        <div className="mt-4 overflow-x-auto hidden sm:block">
          <table className="min-w-[900px] w-full text-dyn-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <Th className="rounded-l-lg">Nom</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th>Dernière connexion</Th>
                <Th className="text-right rounded-r-lg">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="align-middle">
                  <TdLeft>{u.nom}</TdLeft>
                  <Td>{u.email}</Td>
                  <Td>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-200">
                      {u.role}
                    </span>
                  </Td>
                  <Td>{formatDate(u.dernierLogin)}</Td>
                  <TdRight>
                    <div className="inline-flex gap-2">
                      <Btn onClick={() => setEditing(u)}>Modifier</Btn>
                      <Btn tone="warn" onClick={() => deleteUser(u)}>
                        Supprimer
                      </Btn>
                    </div>
                  </TdRight>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-6">
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale: modifier */}
      {editing && (
        <EditModal
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={saveEditedUser}
        />
      )}
    </div>
  );
}

/* ---------- Petites briques UI ---------- */
function Th({ children, className = "" }) {
  return (
    <th className={["text-left px-4 py-3 text-[12.5px] font-bold sticky top-0", className].join(" ")} scope="col">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={["px-4 py-3 border-b border-slate-200 bg-white", className].join(" ")}>{children}</td>;
}
function TdLeft({ children, className = "" }) {
  return <td className={["px-4 py-3 border-b border-slate-200 bg-white rounded-l-xl", className].join(" ")}>{children}</td>;
}
function TdRight({ children, className = "" }) {
  return <td className={["px-4 py-3 border-b border-slate-200 bg-white rounded-r-xl text-right", className].join(" ")}>{children}</td>;
}

/* ✅ Bouton qui respecte le type passé (submit) */
function Btn({ children, tone = "default", type = "button", className = "", ...props }) {
  const styles = {
    default: "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50",
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-transparent",
    warn: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent",
  };
  return (
    <button
      type={type}
      {...props}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${styles[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Modale d'édition ---------- */
function EditModal({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id,
    nom: initial.nom || "",
    email: initial.email || "",
    role: initial.role || "Agent",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom est obligatoire.";
    if (!form.email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (!form.role) e.role = "Sélectionne un rôle.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      await onSave({
        id: form.id,
        nom: form.nom.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      });
      // onSave ferme la modale dans le parent via setEditing(null)
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-[min(560px,95vw)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-lg font-extrabold text-slate-900">Modifier l’utilisateur</h4>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={onCancel}
            disabled={saving}
          >
            Fermer
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <Field label="Nom" name="nom" value={form.nom} onChange={change} error={errors.nom} />
          <Field label="Email" name="email" value={form.email} onChange={change} error={errors.email} />
          <Select
            label="Rôle"
            name="role"
            value={form.role}
            onChange={change}
            options={["Admin", "Superviseur", "Agent"]}
            error={errors.role}
          />

          <div className="mt-2 flex flex-col sm:flex-row justify-end gap-2">
            <Btn onClick={onCancel} disabled={saving}>Annuler</Btn>
            <Btn tone="primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Inputs ---------- */
function Field({ label, name, value, onChange, error }) {
  return (
    <div className="grid">
      <label className="text-[13px] font-semibold text-slate-700 mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className={[
          "rounded-xl border px-3 py-2 text-dyn-sm outline-none",
          "bg-white text-slate-900",
          error ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-300 ring-2 ring-transparent focus:ring-blue-300",
        ].join(" ")}
      />
      {error && <span className="text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
function Select({ label, name, value, onChange, options, error }) {
  return (
    <div className="grid">
      <label className="text-[13px] font-semibold text-slate-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={[
          "rounded-xl border px-3 py-2 text-dyn-sm outline-none",
          "bg-white text-slate-900",
          error ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-300 ring-2 ring-transparent focus:ring-blue-300",
        ].join(" ")}
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
