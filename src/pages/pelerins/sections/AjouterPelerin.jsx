// src/pages/pelerins/AjouterPelerin.jsx
import React, { useMemo, useState } from "react";

const initial = {
  photoPelerin: null,
  photoPasseport: null,
  nom: "",
  prenoms: "",
  dateNaissance: "",
  lieuNaissance: "",
  sexe: "",
  adresse: "",
  contact: "",
  numPasseport: "",
  offre: "",
  voyage: "",
  anneeVoyage: String(new Date().getFullYear()),
  urNom: "",
  urPrenoms: "",
  urContact: "",
  urResidence: "",
};

export default function AjouterPelerin() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const years = useMemo(() => {
    const y0 = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => String(y0 + i));
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }
  function onFile(e) {
    const { name, files } = e.target;
    setForm((f) => ({ ...f, [name]: files?.[0] ?? null }));
  }
  function preview(file) {
    return file ? URL.createObjectURL(file) : "";
  }

  function validate(v) {
    const e = {};
    if (!v.nom.trim()) e.nom = "Obligatoire";
    if (!v.prenoms.trim()) e.prenoms = "Obligatoire";
    if (!v.dateNaissance) e.dateNaissance = "Obligatoire";
    if (!v.sexe) e.sexe = "Obligatoire";
    if (!v.contact.trim()) e.contact = "Obligatoire";
    if (!v.numPasseport.trim()) e.numPasseport = "Obligatoire";
    if (!v.anneeVoyage) e.anneeVoyage = "Obligatoire";
    return e;
  }
  function reset() {
    setForm(initial);
    setErrors({});
  }
  async function onSubmit(e) {
    e.preventDefault();
    const eee = validate(form);
    setErrors(eee);
    if (Object.keys(eee).length) return;

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      // await axios.post("/api/pelerins", fd);
      alert("Pèlerin enregistré (démo)");
      reset();
    } catch (err) {
      console.error(err);
      alert("Erreur d’enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8 backdrop-blur text-white shadow-lg"
    >
      {/* Bandeau titre + photos (empilé mobile, 3 colonnes en md) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
        <PhotoCard
          label="PHOTO PÈLERIN"
          name="photoPelerin"
          file={form.photoPelerin}
          onFile={onFile}
          previewUrl={preview(form.photoPelerin)}
        />

        <div className="order-first md:order-none md:col-auto">
          <Ribbon>Informations personnelles du pèlerin</Ribbon>
          <p className="mt-2 text-xs sm:text-sm text-white/70">
            Remplis les champs ci-dessous. Les champs marqués <span className="text-amber-300">Obligatoire</span> doivent être fournis.
          </p>
        </div>

        <PhotoCard
          label="PHOTO PASSEPORT"
          name="photoPasseport"
          file={form.photoPasseport}
          onFile={onFile}
          previewUrl={preview(form.photoPasseport)}
          align="right"
        />
      </div>

      {/* Perso — 1 col → 2 col en md → 3 col en lg */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Nom du pèlerin" error={errors.nom}>
          <input name="nom" value={form.nom} onChange={onChange} className={inputCls} placeholder="Ex: TRAORE" />
        </Field>
        <Field label="Prénoms du pèlerin" error={errors.prenoms}>
          <input name="prenoms" value={form.prenoms} onChange={onChange} className={inputCls} placeholder="Ismaël O." />
        </Field>
        <Field label="Date de naissance" error={errors.dateNaissance}>
          <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={onChange} className={inputCls} />
        </Field>
        <Field label="Lieu de naissance">
          <input name="lieuNaissance" value={form.lieuNaissance} onChange={onChange} className={inputCls} placeholder="Abidjan" />
        </Field>
        <Field label="Sexe" error={errors.sexe}>
          <select name="sexe" value={form.sexe} onChange={onChange} className={inputCls}>
            <option value="">Sélectionner</option>
            <option value="F">Féminin</option>
            <option value="M">Masculin</option>
          </select>
        </Field>
        <Field label="Adresse du pèlerin">
          <input name="adresse" value={form.adresse} onChange={onChange} className={inputCls} placeholder="Adresse complète" />
        </Field>
        <Field label="Contacts du pèlerin" error={errors.contact} className="lg:col-span-2">
          <input type="tel" name="contact" value={form.contact} onChange={onChange} className={inputCls} placeholder="07 00 00 00 00" />
        </Field>
      </div>

      {/* Hajj */}
      <div className="mt-8">
        <Ribbon>Informations concernant le Hajj</Ribbon>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Numéro de passeport" error={errors.numPasseport}>
          <input name="numPasseport" value={form.numPasseport} onChange={onChange} className={inputCls} placeholder="AA1234567" />
        </Field>
        <Field label="Offres">
          <select name="offre" value={form.offre} onChange={onChange} className={inputCls}>
            <option value="">Sélectionner</option>
            <option value="standard">Standard</option>
            <option value="confort">Confort</option>
            <option value="premium">Premium</option>
          </select>
        </Field>
        <Field label="Voyage">
          <select name="voyage" value={form.voyage} onChange={onChange} className={inputCls}>
            <option value="">Sélectionner</option>
            <option value="vol">Vol</option>
            <option value="bus">Bus</option>
            <option value="mixte">Mixte</option>
          </select>
        </Field>
        <Field label="Année voyage" error={errors.anneeVoyage}>
          <select name="anneeVoyage" value={form.anneeVoyage} onChange={onChange} className={inputCls}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Urgence */}
      <div className="mt-8">
        <Ribbon>Personnes à contacter en cas d’urgence</Ribbon>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nom personne à contacter">
          <input name="urNom" value={form.urNom} onChange={onChange} className={inputCls} />
        </Field>
        <Field label="Prénoms personne à contacter">
          <input name="urPrenoms" value={form.urPrenoms} onChange={onChange} className={inputCls} />
        </Field>
        <Field label="Contact personne à contacter">
          <input type="tel" name="urContact" value={form.urContact} onChange={onChange} className={inputCls} placeholder="Téléphone" />
        </Field>
        <Field label="Résidence personne à contacter">
          <input name="urResidence" value={form.urResidence} onChange={onChange} className={inputCls} />
        </Field>
      </div>

      {/* Actions — barre collante sur mobile pour accessibilité */}
      <div className="mt-8">
        <div className="fixed inset-x-0 bottom-0 z-20 bg-slate-900/80 p-3 backdrop-blur md:static md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400/40 md:flex-none md:px-5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-slate-900 shadow hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60 md:flex-none md:px-5"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ---------- UI bits ---------- */

function Ribbon({ children }) {
  return (
    <div className="w-full rounded-md border border-black/20 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-3 py-2 text-center text-sm font-extrabold uppercase tracking-wider text-slate-900 shadow">
      {children}
    </div>
  );
}

function PhotoCard({ label, name, file, onFile, previewUrl, align = "left" }) {
  return (
    <div className={align === "right" ? "md:ml-auto" : ""}>
      <div className="mx-auto grid aspect-[3/4] w-40 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner sm:w-44">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-white/60">Aperçu</span>
        )}
      </div>
      <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-amber-200 hover:bg-amber-500/20 sm:w-auto">
        {label}
        <input type="file" name={name} accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {file && <div className="mt-1 max-w-[11rem] truncate text-[11px] text-white/60">{file.name}</div>}
    </div>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="text-[12px] font-extrabold tracking-wide text-amber-300/90">
        {label} {error && <span className="text-red-300">• {error}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent placeholder:text-white/50 focus:border-amber-300/40 focus:ring-amber-400/30";
