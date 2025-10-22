// src/pages/pelerins/ModifierPelerin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/* ---------- Styles réutilisables (thème bleu & blanc) ---------- */
const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const labelCls = "text-dyn-xs font-semibold text-slate-700";
const baseInput =
  "w-full rounded-xl border bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent border-slate-300 focus:ring-blue-300";
const baseSelect =
  "w-full rounded-xl border bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent border-slate-300 focus:ring-blue-300";

/* ---------- Helpers ---------- */
const emptyRow = {
  id: "",
  photoPelerin: "",
  photoPasseport: "",
  nom: "",
  prenoms: "",
  dateNaissance: "",
  lieuNaissance: "",
  sexe: "",
  adresse: "",
  contacts: "",
  numPasseport: "",
  offre: "",
  voyage: "",
  anneeVoyage: "2025",
  urgenceNom: "",
  urgencePrenoms: "",
  urgenceContact: "",
  urgenceResidence: "",
  enregistrePar: "",
};

function Section({ title, children }) {
  return (
    <div className={`${card} p-4 md:p-5`}>
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-200 text-dyn-sm font-extrabold">
        {title}
      </div>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function PhotoInput({ label, preview, onChange }) {
  return (
    <div className="grid gap-2">
      <div className="grid place-content-center rounded-2xl border border-slate-200 bg-white h-56 w-full sm:w-48 overflow-hidden shadow-sm">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-slate-400 text-dyn-sm">Aperçu</span>
        )}
      </div>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-dyn-sm font-semibold text-blue-700 hover:bg-blue-100">
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = URL.createObjectURL(f);
            onChange(url, f);
          }}
        />
        {label}
      </label>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ModifierPelerin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation(); // on attend state.row depuis la liste
  const initial = useMemo(() => ({ ...emptyRow, ...(state?.row || {}) }), [state]);

  const [form, setForm] = useState(initial);

  // si arrivée directe sans state, on pourrait fetch par id plus tard
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    // ICI: branche ton PUT/PATCH API (ex: await axios.put(`/api/pelerins/${id}`, form))
    alert("Modifications enregistrées (démo front-end) ✔️");
    navigate(-1); // retour
  }

  return (
    <div className="space-y-5 text-dyn">
      {/* ===== Header ===== */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-dyn-title font-bold text-slate-900">Modifier un pèlerin</h1>
          <p className="text-slate-600 text-dyn-sm">
            Mets à jour les informations du pèlerin. Les champs marqués <b>Obligatoire</b> doivent être fournis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            form="edit-pelerin"
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </div>
      </header>

      <form id="edit-pelerin" onSubmit={onSubmit} className="grid gap-5">
        {/* ===== Bande photos + intro ===== */}
        <div className={`${card} p-4 md:p-5`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto,1fr,auto]">
            <PhotoInput
              label="Photo pèlerin"
              preview={form.photoPelerin}
              onChange={(url) => set("photoPelerin", url)}
            />

            <div className="grid gap-3">
              <div className={`${card} p-3`}>
                <div className="text-dyn-sm font-extrabold uppercase tracking-wider text-blue-800">
                  Informations personnelles du pèlerin
                </div>
                <p className="text-slate-600 text-dyn-sm">
                  Remplis les champs ci-dessous. Les champs marqués <b>Obligatoire</b> doivent être fournis.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Nom (Obligatoire)">
                  <input
                    className={baseInput}
                    value={form.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    placeholder="Ex: TRAORE"
                    required
                  />
                </Field>
                <Field label="Prénoms (Obligatoire)">
                  <input
                    className={baseInput}
                    value={form.prenoms}
                    onChange={(e) => set("prenoms", e.target.value)}
                    placeholder="Ex: Ismaël O."
                    required
                  />
                </Field>

                <Field label="Date de naissance">
                  <input
                    type="date"
                    className={baseInput}
                    value={form.dateNaissance || ""}
                    onChange={(e) => set("dateNaissance", e.target.value)}
                  />
                </Field>
                <Field label="Lieu de naissance">
                  <input
                    className={baseInput}
                    value={form.lieuNaissance}
                    onChange={(e) => set("lieuNaissance", e.target.value)}
                    placeholder="Ex: Abidjan"
                  />
                </Field>

                <Field label="Sexe">
                  <select
                    className={baseSelect}
                    value={form.sexe}
                    onChange={(e) => set("sexe", e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option>Masculin</option>
                    <option>Féminin</option>
                  </select>
                </Field>
                <Field label="Adresse">
                  <input
                    className={baseInput}
                    value={form.adresse}
                    onChange={(e) => set("adresse", e.target.value)}
                    placeholder="Adresse complète"
                  />
                </Field>

                <Field label="Contacts (Obligatoire)">
                  <input
                    className={baseInput}
                    value={form.contacts}
                    onChange={(e) => set("contacts", e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                  />
                </Field>
              </div>
            </div>

            <PhotoInput
              label="Photo passeport"
              preview={form.photoPasseport}
              onChange={(url) => set("photoPasseport", url)}
            />
          </div>
        </div>

        {/* ===== Hajj ===== */}
        <Section title="Informations concernant le Hajj">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Numéro de passeport">
              <input
                className={baseInput}
                value={form.numPasseport}
                onChange={(e) => set("numPasseport", e.target.value)}
                placeholder="AA1234567"
              />
            </Field>

            <Field label="Offres">
              <select
                className={baseSelect}
                value={form.offre}
                onChange={(e) => set("offre", e.target.value)}
              >
                <option value="">Sélectionner</option>
                <option>Standard</option>
                <option>Premium</option>
                <option>VIP</option>
              </select>
            </Field>

            <Field label="Voyage">
              <input
                className={baseInput}
                value={form.voyage}
                onChange={(e) => set("voyage", e.target.value)}
                placeholder="Vol direct - Groupe 1"
              />
            </Field>

            <Field label="Année voyage">
              <select
                className={baseSelect}
                value={form.anneeVoyage}
                onChange={(e) => set("anneeVoyage", e.target.value)}
              >
                {Array.from({ length: 6 }, (_, i) => 2024 + i).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* ===== Urgence ===== */}
        <Section title="Personnes à contacter en cas d’urgence">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Nom personne à contacter">
              <input
                className={baseInput}
                value={form.urgenceNom}
                onChange={(e) => set("urgenceNom", e.target.value)}
                placeholder="NOM"
              />
            </Field>
            <Field label="Prénoms personne à contacter">
              <input
                className={baseInput}
                value={form.urgencePrenoms}
                onChange={(e) => set("urgencePrenoms", e.target.value)}
                placeholder="Prénoms"
              />
            </Field>

            <Field label="Contact personne à contacter">
              <input
                className={baseInput}
                value={form.urgenceContact}
                onChange={(e) => set("urgenceContact", e.target.value)}
                placeholder="Téléphone"
              />
            </Field>
            <Field label="Résidence personne à contacter">
              <input
                className={baseInput}
                value={form.urgenceResidence}
                onChange={(e) => set("urgenceResidence", e.target.value)}
                placeholder="Adresse / Quartier"
              />
            </Field>
          </div>
        </Section>

        {/* ===== Infos d’enregistrement (lecture seule) ===== */}
        <div className={`${card} p-4 md:p-5`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Enregistré par">
              <input className={`${baseInput} opacity-80`} value={form.enregistrePar || ""} readOnly />
            </Field>
            <Field label="ID fiche">
              <input className={`${baseInput} opacity-80`} value={form.id || id || ""} readOnly />
            </Field>
          </div>
        </div>

        {/* ===== Actions bas de page ===== */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
