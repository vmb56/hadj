// src/pages/utilisateurs/InscriptionUtilisateur.jsx
import React, { useState } from "react";

export default function InscriptionUtilisateur() {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    role: "Agent",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const eMap = {};
    if (!form.nom.trim()) eMap.nom = "Le nom est obligatoire.";
    if (!form.email.trim()) eMap.email = "L’email est obligatoire.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) eMap.email = "Email invalide.";
    if (!form.password) eMap.password = "Mot de passe obligatoire.";
    if (form.password && form.password.length < 6)
      eMap.password = "6 caractères minimum.";
    if (form.confirm !== form.password)
      eMap.confirm = "Les mots de passe ne correspondent pas.";

    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    alert(`Utilisateur "${form.nom}" créé (rôle: ${form.role}).`);
    setForm({ nom: "", email: "", role: "Agent", password: "", confirm: "" });
  };

  return (
    <div className="mt-4 space-y-4 text-dyn">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-dyn-title font-extrabold text-slate-900">
          Inscription utilisateur
        </h3>
        <p className="text-dyn-sm text-slate-600">
          Créer un compte et définir son rôle.
        </p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom"
            name="nom"
            value={form.nom}
            onChange={onChange}
            error={errors.nom}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            error={errors.email}
            placeholder="ex: jean.dupont@exemple.ci"
          />

          <Select
            label="Rôle"
            name="role"
            value={form.role}
            onChange={onChange}
            options={["Administrateur", "Superviseur", "Agent"]}
          />
          <div />

          <Field
            label="Mot de passe"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            placeholder="Au moins 6 caractères"
          />
          <Field
            label="Confirmer le mot de passe"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={onChange}
            error={errors.confirm}
          />

          <div className="sm:col-span-2 flex items-center justify-between">
            <p className="text-dyn-sm text-slate-500">
              Conseil : utilise un mot de passe long et unique.
            </p>
            <button
              className="rounded-xl bg-blue-600 px-6 py-2 font-bold text-white shadow-sm hover:bg-blue-700"
              type="submit"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Champs ---------- */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}) {
  return (
    <div className="grid">
      <label
        htmlFor={name}
        className="mb-1 text-[13px] font-semibold text-slate-700"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "rounded-xl border px-3 py-2 text-dyn-sm outline-none",
          "bg-white text-slate-900",
          error
            ? "border-rose-300 ring-2 ring-rose-200"
            : "border-slate-300 ring-2 ring-transparent focus:ring-blue-300",
        ].join(" ")}
        autoComplete={type === "password" ? "new-password" : "off"}
      />
      {error && <span className="mt-1 text-xs text-rose-600">{error}</span>}
    </div>
  );
}

function Select({ label, name, value, onChange, options = [] }) {
  return (
    <div className="grid">
      <label
        htmlFor={name}
        className="mb-1 text-[13px] font-semibold text-slate-700"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
