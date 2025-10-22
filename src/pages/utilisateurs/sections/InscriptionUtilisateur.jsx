import React, { useState } from "react";

export default function InscriptionUtilisateur() {
  const [form, setForm] = useState({ nom: "", email: "", role: "Agent", password: "", confirm: "" });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.password) {
      alert("Nom, email et mot de passe sont obligatoires.");
      return;
    }
    if (form.password !== form.confirm) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    alert(`Utilisateur "${form.nom}" créé (rôle: ${form.role}).`);
    setForm({ nom: "", email: "", role: "Agent", password: "", confirm: "" });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white mt-4">
      <h3 className="text-xl font-bold text-orange-400">Inscription utilisateur</h3>
      <p className="text-slate-300 text-sm mb-4">Créer un compte et définir son rôle.</p>

      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom" name="nom" value={form.nom} onChange={onChange} />
        <Field label="Email" name="email" value={form.email} onChange={onChange} type="email" />
        <Select
          label="Rôle"
          name="role"
          value={form.role}
          onChange={onChange}
          options={["Administrateur", "Superviseur", "Agent"]}
        />
        <div />
        <Field label="Mot de passe" name="password" value={form.password} onChange={onChange} type="password" />
        <Field label="Confirmer le mot de passe" name="confirm" value={form.confirm} onChange={onChange} type="password" />
        <div className="sm:col-span-2 flex justify-end">
          <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-2 font-semibold">Créer</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="grid">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400/40"
      />
    </div>
  );
}
function Select({ label, name, value, onChange, options = [] }) {
  return (
    <div className="grid">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400/40"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
