import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ModifierMedicale() {
  const location = useLocation();
  const navigate = useNavigate();
  const { row } = location.state || {};

  const [form, setForm] = useState({
    numeroCMAH: "",
    passeport: "",
    nom: "",
    prenoms: "",
    groupeSanguin: "",
    poids: "",
    tension: "",
    pouls: "",
    diabete: "",
    maladieCardiaque: "",
    covid: "",
    vulnerabilite: "",
    examenParaclinique: "",
    antecedents: "",
    accompagnements: "",
    analysePsychiatrique: "",
  });

  useEffect(() => {
    if (row) setForm(row);
  }, [row]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Fiche médicale de ${form.nom} ${form.prenoms} mise à jour avec succès !`);
    navigate("/medicale/liste");
  };

  return (
    <div className="min-h-screen bg-[#022b2e] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">
          Modifier la fiche médicale
        </h2>
        <p className="text-slate-300 mb-6">
          Mets à jour les informations médicales du pèlerin sélectionné.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Informations de base */}
          <Input label="Numéro CMAH" name="numeroCMAH" value={form.numeroCMAH} onChange={handleChange} />
          <Input label="N° Passeport" name="passeport" value={form.passeport} onChange={handleChange} />
          <Input label="Nom" name="nom" value={form.nom} onChange={handleChange} />
          <Input label="Prénoms" name="prenoms" value={form.prenoms} onChange={handleChange} />
          <Input label="Groupe Sanguin" name="groupeSanguin" value={form.groupeSanguin} onChange={handleChange} />
          <Input label="Poids" name="poids" value={form.poids} onChange={handleChange} />
          <Input label="Tension" name="tension" value={form.tension} onChange={handleChange} />
          <Input label="Pouls" name="pouls" value={form.pouls} onChange={handleChange} />

          {/* Santé */}
          <Select label="Diabète" name="diabete" value={form.diabete} onChange={handleChange} options={["Oui", "Non"]} />
          <Select label="Maladie Cardiaque" name="maladieCardiaque" value={form.maladieCardiaque} onChange={handleChange} options={["Oui", "Non"]} />
          <Select label="Covid-19" name="covid" value={form.covid} onChange={handleChange} options={["Négatif", "Positif", "Vacciné"]} />
          <Input label="Vulnérabilité" name="vulnerabilite" value={form.vulnerabilite} onChange={handleChange} />

          {/* Examens */}
          <TextArea label="Examens Paracliniques" name="examenParaclinique" value={form.examenParaclinique} onChange={handleChange} />
          <TextArea label="Antécédents" name="antecedents" value={form.antecedents} onChange={handleChange} />
          <TextArea label="Accompagnements" name="accompagnements" value={form.accompagnements} onChange={handleChange} />
          <TextArea label="Analyse Psychiatrique" name="analysePsychiatrique" value={form.analysePsychiatrique} onChange={handleChange} />

          {/* Boutons */}
          <div className="col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-semibold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================
   Composants réutilisables
========================== */
function Input({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400/40"
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col sm:col-span-2">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows="2"
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400/40 resize-none"
      ></textarea>
    </div>
  );
}

function Select({ label, name, value, onChange, options = [] }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-slate-300 mb-1">{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400/40"
      >
        <option value="">Sélectionner...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
