// src/pages/utilisateurs/ListeUtilisateurs.jsx
import React, { useMemo, useState } from "react";

/* ===== Données de départ (démo) ===== */
const SEED = [
  { id: 1, nom: "Admin", email: "admin@bmvt.ci", role: "Administrateur", actif: true,  dernierLogin: "2025-10-20 10:22" },
  { id: 2, nom: "Sarah", email: "sarah@bmvt.ci", role: "Agent",          actif: true,  dernierLogin: "2025-10-21 08:05" },
  { id: 3, nom: "Omar",  email: "omar@bmvt.ci",  role: "Superviseur",    actif: false, dernierLogin: "2025-09-30 17:41" },
];

export default function ListeUtilisateurs() {
  const [rows, setRows] = useState(SEED);
  const [q, setQ] = useState("");

  // états modales / tooltips
  const [editing, setEditing] = useState(null);     // { ...user } à éditer
  const [confirm, setConfirm] = useState(null);     // { user }
  const [hover, setHover] = useState(null);         // { id, type: 'edit' | 'toggle' }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((u) =>
      `${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(s)
    );
  }, [q, rows]);

  function saveEditedUser(data) {
    setRows((prev) => prev.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
    setEditing(null);
  }

  function askToggle(user) {
    setConfirm({ user });
  }
  function doToggle() {
    if (!confirm?.user) return;
    const id = confirm.user.id;
    setRows((prev) =>
      prev.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u))
    );
    setConfirm(null);
  }

  return (
    <div className="text-dyn">
      {/* En-tête clair */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h3 className="text-dyn-title font-extrabold text-slate-900">Liste des utilisateurs</h3>
            <p className="text-dyn-sm text-slate-600">
              Rechercher, consulter et gérer les comptes.
            </p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Recherche (nom, mail, rôle)"
            className="w-full sm:w-72 rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
          />
        </div>
      </div>

      {/* ====== Cartes mobiles (claires) ====== */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-500">Aucun résultat.</p>
        ) : (
          filtered.map((u) => (
            <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{u.nom}</div>
                  <div className="text-xs text-slate-600 truncate">{u.email}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Rôle : <span className="font-semibold text-blue-700">{u.role}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                    u.actif
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200"
                  }`}
                >
                  {u.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="mt-2 text-[12px] text-slate-600">
                Dernière connexion : <span className="text-slate-800">{u.dernierLogin}</span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Btn onClick={() => setEditing(u)}>Modifier</Btn>
                <Btn tone={u.actif ? "warn" : "primary"} onClick={() => askToggle(u)}>
                  {u.actif ? "Désactiver" : "Activer"}
                </Btn>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ====== Tableau desktop (clair) ====== */}
      <div className="mt-4 overflow-x-auto hidden sm:block">
        <table className="min-w-[900px] border-separate border-spacing-y-8 text-dyn-sm">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Nom</Th>
              <Th>Email</Th>
              <Th>Rôle</Th>
              <Th>Actif</Th>
              <Th>Dernière connexion</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td colSpan={7}>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow transition">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <Td className="col-span-1">{i + 1}</Td>
                      <Td className="col-span-2 font-semibold text-slate-900">{u.nom}</Td>
                      <Td className="col-span-3 text-slate-700 truncate">{u.email}</Td>
                      <Td className="col-span-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-200">
                          {u.role}
                        </span>
                      </Td>
                      <Td className="col-span-1">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                            u.actif
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }`}
                        >
                          {u.actif ? "Oui" : "Non"}
                        </span>
                      </Td>
                      <Td className="col-span-2 tabular-nums text-slate-700">{u.dernierLogin}</Td>
                      <Td className="col-span-1 text-right">
                        <div className="inline-flex gap-2 relative">
                          <span
                            className="relative hidden md:inline-block"
                            onMouseEnter={() => setHover({ id: u.id, type: "edit" })}
                            onMouseLeave={() => setHover(null)}
                          >
                            <Btn onClick={() => setEditing(u)}>Modifier</Btn>
                            {hover?.id === u.id && hover?.type === "edit" && (
                              <Tooltip>Éditer le profil (nom, email, rôle, actif)</Tooltip>
                            )}
                          </span>

                          <span
                            className="relative hidden md:inline-block"
                            onMouseEnter={() => setHover({ id: u.id, type: "toggle" })}
                            onMouseLeave={() => setHover(null)}
                          >
                            <Btn tone={u.actif ? "warn" : "primary"} onClick={() => askToggle(u)}>
                              {u.actif ? "Désactiver" : "Activer"}
                            </Btn>
                            {hover?.id === u.id && hover?.type === "toggle" && (
                              <Tooltip>
                                {u.actif
                                  ? "Empêche la connexion de cet utilisateur"
                                  : "Réautorise la connexion de cet utilisateur"}
                              </Tooltip>
                            )}
                          </span>

                          {/* Boutons visibles sans tooltip en < md */}
                          <span className="md:hidden inline-flex gap-2">
                            <Btn onClick={() => setEditing(u)}>Modifier</Btn>
                            <Btn tone={u.actif ? "warn" : "primary"} onClick={() => askToggle(u)}>
                              {u.actif ? "Désactiver" : "Activer"}
                            </Btn>
                          </span>
                        </div>
                      </Td>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-4">
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale: modifier */}
      {editing && (
        <EditModal
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={saveEditedUser}
        />
      )}

      {/* Confirmation: activer/désactiver */}
      {confirm && (
        <ConfirmModal
          user={confirm.user}
          onCancel={() => setConfirm(null)}
          onConfirm={doToggle}
        />
      )}
    </div>
  );
}

/* ---------- Petites briques UI (thème clair) ---------- */
function Th({ children, className = "" }) {
  return (
    <th
      className={[
        "text-left px-4 py-2 whitespace-nowrap text-[12.5px] font-bold",
        "bg-slate-100 text-slate-700 rounded-lg",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "", colSpan }) {
  return (
    <div
      col-span={colSpan}
      className={["px-2 py-1 whitespace-nowrap text-slate-800", className].join(" ")}
    >
      {children}
    </div>
  );
}
function Btn({ children, tone = "default", ...props }) {
  const styles = {
    default:
      "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50",
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 border border-transparent",
    warn:
      "bg-rose-600 text-white hover:bg-rose-700 border border-transparent",
  };
  return (
    <button
      {...props}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${styles[tone]}`}
      type="button"
    >
      {children}
    </button>
  );
}
function Tooltip({ children }) {
  return (
    <div className="absolute right-0 translate-y-2 mt-1 rounded-md bg-slate-900 text-[11px] text-white px-2 py-1 shadow-lg ring-1 ring-black/10">
      {children}
    </div>
  );
}

/* ---------- Modale d'édition (claire) ---------- */
function EditModal({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id,
    nom: initial.nom || "",
    email: initial.email || "",
    role: initial.role || "Agent",
    actif: !!initial.actif,
  });
  const [errors, setErrors] = useState({});

  function change(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
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

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-[min(560px,95vw)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-lg font-extrabold text-slate-900">Modifier l’utilisateur</h4>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
            onClick={onCancel}
          >
            Fermer
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <Field label="Nom"   name="nom"   value={form.nom}   onChange={change} error={errors.nom} />
          <Field label="Email" name="email" value={form.email} onChange={change} error={errors.email} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Rôle"
              name="role"
              value={form.role}
              onChange={change}
              options={["Administrateur", "Superviseur", "Agent"]}
              error={errors.role}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-dyn-sm text-slate-800">
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={change}
                  className="h-4 w-4 accent-blue-600"
                />
                Actif (peut se connecter)
              </label>
            </div>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row justify-end gap-2">
            <Btn onClick={onCancel}>Annuler</Btn>
            <Btn tone="primary" type="submit">Enregistrer</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Modale de confirmation (claire) ---------- */
function ConfirmModal({ user, onCancel, onConfirm }) {
  const goingToDisable = !!user.actif;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-[min(520px,95vw)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <h4 className="text-lg font-extrabold mb-2">
          {goingToDisable ? "Désactiver" : "Activer"} l’utilisateur
        </h4>
        <p className="text-slate-700">
          {goingToDisable
            ? `L’utilisateur ${user.nom} ne pourra plus se connecter tant qu’il est désactivé.`
            : `L’utilisateur ${user.nom} sera de nouveau autorisé à se connecter.`}
        </p>

        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
          <Btn onClick={onCancel}>Annuler</Btn>
          <Btn tone={goingToDisable ? "warn" : "primary"} onClick={onConfirm}>
            Confirmer
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inputs (clairs) ---------- */
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
          error
            ? "border-rose-300 ring-2 ring-rose-200"
            : "border-slate-300 ring-2 ring-transparent focus:ring-blue-300",
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
          error
            ? "border-rose-300 ring-2 ring-rose-200"
            : "border-slate-300 ring-2 ring-transparent focus:ring-blue-300",
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
