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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white mt-4 relative">
      {/* Header + recherche */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-orange-400">Liste des utilisateurs</h3>
          <p className="text-slate-300 text-sm">
            Rechercher, consulter et gérer les comptes.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche (nom, mail, rôle)"
          className="w-full sm:w-72 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
        />
      </div>

      {/* ====== Cartes mobiles ====== */}
      <div className="mt-4 grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-400">Aucun résultat.</p>
        ) : (
          filtered.map((u) => (
            <article key={u.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{u.nom}</div>
                  <div className="text-xs text-slate-300 truncate">{u.email}</div>
                  <div className="mt-1 text-xs text-slate-300">
                    Rôle :{" "}
                    <span className="font-semibold text-amber-300">{u.role}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    u.actif ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                  }`}
                >
                  {u.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="mt-2 text-[12px] text-slate-300">
                Dernière connexion : <span className="text-slate-200">{u.dernierLogin}</span>
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

      {/* ====== Tableau desktop ====== */}
      <div className="mt-4 overflow-x-auto hidden sm:block">
        <table className="min-w-[900px] border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="bg-orange-500/10 text-amber-300 uppercase tracking-wide">
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
              <tr key={u.id} className="bg-white/6 hover:bg-white/12 transition relative">
                <Td>{i + 1}</Td>
                <Td className="font-semibold">{u.nom}</Td>
                <Td className="text-slate-200">{u.email}</Td>
                <Td>{u.role}</Td>
                <Td>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.actif ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {u.actif ? "Oui" : "Non"}
                  </span>
                </Td>
                <Td>{u.dernierLogin}</Td>
                <Td className="text-right">
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
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-slate-400 py-4">
                  Aucun résultat
                </Td>
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

/* ---------- Petites briques UI ---------- */
function Th({ children, className = "" }) {
  return <th className={`text-left px-4 py-3 whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>;
}
function Btn({ children, tone = "default", ...props }) {
  const styles = {
    default: "bg-white/10 hover:bg-white/15 text-white",
    primary: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200",
    warn: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${styles[tone]}`}
      type="button"
    >
      {children}
    </button>
  );
}
function Tooltip({ children }) {
  return (
    <div className="absolute right-0 translate-y-2 mt-1 rounded-md bg-black/80 text-[11px] text-slate-100 px-2 py-1 shadow-lg border border-white/10">
      {children}
    </div>
  );
}

/* ---------- Modale d'édition ---------- */
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-[min(560px,95vw)] rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl text-white">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-lg font-bold text-orange-300">Modifier l’utilisateur</h4>
          <button className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15" onClick={onCancel}>
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={change}
                  className="h-4 w-4"
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

/* ---------- Modale de confirmation activation/désactivation ---------- */
function ConfirmModal({ user, onCancel, onConfirm }) {
  const goingToDisable = !!user.actif;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-[min(520px,95vw)] rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl text-white">
        <h4 className="text-lg font-bold mb-2">
          {goingToDisable ? "Désactiver" : "Activer"} l’utilisateur
        </h4>
        <p className="text-slate-200">
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

/* ---------- Inputs ---------- */
function Field({ label, name, value, onChange, error }) {
  return (
    <div className="grid">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400/40"
      />
      {error && <span className="text-xs text-rose-300 mt-1">{error}</span>}
    </div>
  );
}
function Select({ label, name, value, onChange, options, error }) {
  return (
    <div className="grid">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-300 mt-1">{error}</span>}
    </div>
  );
}
