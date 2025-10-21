// src/pages/pelerins/ModifierPelerin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/* ---------- Styles réutilisables ---------- */
const card =
  "rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg text-white";
const labelCls = "text-[12px] font-semibold text-slate-300";
const baseInput =
  "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-amber-400/40 placeholder:text-slate-400";
const baseSelect =
  "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-amber-400/40";

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
    <div className={`${card} p-4 sm:p-5`}>
      <div className="mb-3 text-[12px] font-extrabold uppercase tracking-wider text-amber-300">
        {title}
      </div>
      <div className="grid gap-3">{children}</div>
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
      <div className="grid place-content-center rounded-2xl border border-white/10 bg-white/5 h-56 w-full sm:w-48 overflow-hidden">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-slate-400 text-sm">Aperçu</span>
        )}
      </div>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
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
        <span>{label}</span>
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

  // si arrivées directes sans state, on pourrait fetch par id plus tard
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    // Ici tu brancheras ton PUT/PATCH vers l’API
    // await axios.put(`/api/pelerins/${id}`, form)
    alert("Modifications enregistrées (démo front-end) ✔️");
    navigate(-1); // retour
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-orange-400">Modifier un pèlerin</h1>
          <p className="text-slate-300/90 text-sm">
            Mets à jour les informations du pèlerin. Les champs marqués <b>Obligatoire</b>
            doivent être fournis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Annuler
          </button>
          <button
            form="edit-pelerin"
            type="submit"
            className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Enregistrer
          </button>
        </div>
      </header>

      <form id="edit-pelerin" onSubmit={onSubmit} className="grid gap-5">
        {/* Bande photos + intro */}
        <div className={`grid gap-4 ${card} p-4 sm:p-5`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto,1fr,auto]">
            <PhotoInput
              label="Photo pèlerin"
              preview={form.photoPelerin}
              onChange={(url) => set("photoPelerin", url)}
            />

            <div className="grid gap-3">
              <div className={`${card} p-3`}>
                <div className="text-[12px] font-extrabold uppercase tracking-wider text-amber-300">
                  Informations personnelles du pèlerin
                </div>
                <p className="text-slate-300/90 text-sm">
                  Remplis les champs ci-dessous. Les champs marqués{" "}
                  <b>Obligatoire</b> doivent être fournis.
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

        {/* Hajj */}
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

        {/* Urgence */}
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

        {/* Infos d’enregistrement (lecture seule) */}
        <div className={`${card} p-4 sm:p-5`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Enregistré par">
              <input className={`${baseInput} opacity-80`} value={form.enregistrePar || ""} readOnly />
            </Field>
            <Field label="ID fiche">
              <input className={`${baseInput} opacity-80`} value={form.id || id || ""} readOnly />
            </Field>
          </div>
        </div>

        {/* Actions bas de page (dupliquées pour confort) */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
