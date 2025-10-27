// src/pages/pelerins/AjouterPelerin.jsx
import React, { useMemo, useState, useEffect } from "react";

/* ========= Config API ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

/* ========= Récup user ========= */
const USER_KEYS = ["bmvt_user", "bmvt_me", "user"];
function getUserFromStorage() {
  for (const k of USER_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const u = JSON.parse(raw);
      if (u && (u.name || u.email || u.id)) return u;
    } catch {}
  }
  return null;
}

/* --------- État initial --------- */
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
  anneeVoyage: "",
  urNom: "",
  urPrenoms: "",
  urContact: "",
  urResidence: "",
};

export default function AjouterPelerin() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // ======== DATA depuis /api/voyages ========
  const [voyages, setVoyages] = useState([]); // {id, nom, annee, offres?}
  const [loadingVoyages, setLoadingVoyages] = useState(false);
  const [errVoyages, setErrVoyages] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadVoyages() {
      setLoadingVoyages(true);
      setErrVoyages("");
      try {
        const res = await fetch(`${API_BASE}/api/voyages`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) {
          setVoyages(items);
          // pré-sélection douce
          const noms = uniqueNoms(items);
          if (noms.length && !form.voyage) {
            const firstNom = noms[0];
            const years = yearsForNom(items, firstNom);
            setForm((f) => ({
              ...f,
              voyage: firstNom,
              anneeVoyage: years[0] ? String(years[0]) : "",
              offre: ""
            }));
          }
        }
      } catch (e) {
        if (!cancelled) setErrVoyages(e.message || "Échec de chargement des voyages");
      } finally {
        if (!cancelled) setLoadingVoyages(false);
      }
    }
    loadVoyages();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========= LISTES dérivées ========= */

  // Tous les noms distincts présents dans la table `voyages`
  const nomsVoyage = useMemo(() => uniqueNoms(voyages), [voyages]);

  // Années proposées pour le nom sélectionné (on garde ce filtrage)
  const anneesForSelectedNom = useMemo(
    () => (form.voyage ? yearsForNom(voyages, form.voyage) : []),
    [voyages, form.voyage]
  );

  // ✅ NOUVEAU: toutes les offres disponibles dans la table `voyages` (union)
  const offresGlobales = useMemo(() => {
    const set = new Set();
    for (const v of voyages || []) {
      parseOffres(v?.offres).forEach((o) => set.add(o));
    }
    return Array.from(set);
  }, [voyages]);

  // garde-fous
  useEffect(() => {
    if (form.voyage && !nomsVoyage.includes(form.voyage)) {
      setForm((f) => ({ ...f, voyage: "", anneeVoyage: "", offre: "" }));
    }
  }, [nomsVoyage, form.voyage]);

  useEffect(() => {
    if (!form.voyage) return;
    const years = anneesForSelectedNom.map(String);
    if (form.anneeVoyage && !years.includes(String(form.anneeVoyage))) {
      setForm((f) => ({ ...f, anneeVoyage: years[0] ?? "", offre: "" }));
    }
  }, [anneesForSelectedNom, form.voyage, form.anneeVoyage]);

  useEffect(() => {
    if (form.offre && !offresGlobales.includes(form.offre)) {
      setForm((f) => ({ ...f, offre: "" }));
    }
  }, [offresGlobales, form.offre]);

  /* ========= Handlers ========= */
  function onChange(e) {
    const { name, value } = e.target;
    if (name === "numPasseport") {
      const cleaned = value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 9);
      setForm((f) => ({ ...f, numPasseport: cleaned }));
      if (cleaned.length === 9) setErrors((er) => ({ ...er, numPasseport: undefined }));
      return;
    }
    if (name === "voyage") {
      const yearsFor = yearsForNom(voyages, value);
      setForm((f) => ({
        ...f,
        voyage: value,
        anneeVoyage: yearsFor[0] ? String(yearsFor[0]) : "",
        offre: ""
      }));
      return;
    }
    if (name === "anneeVoyage") {
      setForm((f) => ({ ...f, anneeVoyage: value, offre: "" }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onFile(e) {
    const { name, files } = e.target;
    setForm((f) => ({ ...f, [name]: files?.[0] ?? null }));
  }

  function normalizeDateStr(s) {
    return s || "";
  }

  function validate(v) {
    const e = {};
    if (!v.nom.trim()) e.nom = "Obligatoire";
    if (!v.prenoms.trim()) e.prenoms = "Obligatoire";
    if (!v.dateNaissance) e.dateNaissance = "Obligatoire";
    if (!v.sexe) e.sexe = "Obligatoire";
    if (!v.contact.trim()) e.contact = "Obligatoire";
    if (!/^[A-Z0-9]{9}$/.test(v.numPasseport || "")) {
      e.numPasseport = "Doit contenir exactement 9 caractères alphanumériques";
    }
    if (!v.voyage) e.voyage = "Sélectionne un type de voyage";
    if (!v.anneeVoyage) e.anneeVoyage = "Sélectionne une année";
    // ✅ validation basée sur la liste globale d’offres
    if (offresGlobales.length > 0 && !v.offre) {
      e.offre = "Sélectionne une offre";
    }
    return e;
  }

  function reset() {
    setForm((f) => ({
      ...initial,
      voyage: nomsVoyage[0] ?? "",
      anneeVoyage: nomsVoyage[0] ? String((yearsForNom(voyages, nomsVoyage[0])[0] ?? "")) : "",
      offre: ""
    }));
    setErrors({});
  }

  function toast(text, type = "success") {
    setNotice({ text, type });
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setNotice(null), 2500);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const eee = validate(form);
    setErrors(eee);
    if (Object.keys(eee).length) return;

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("nom", form.nom ?? "");
      fd.append("prenoms", form.prenoms ?? "");
      fd.append("dateNaissance", normalizeDateStr(form.dateNaissance));
      fd.append("lieuNaissance", form.lieuNaissance ?? "");
      fd.append("sexe", form.sexe ?? "");
      fd.append("adresse", form.adresse ?? "");
      fd.append("contact", form.contact ?? "");
      fd.append("numPasseport", form.numPasseport ?? "");
      // ▼ valeurs issues de la table voyages (globale)
      fd.append("offre", form.offre ?? "");
      fd.append("voyage", form.voyage ?? "");
      fd.append("anneeVoyage", form.anneeVoyage ?? "");

      fd.append("urNom", form.urNom ?? "");
      fd.append("urPrenoms", form.urPrenoms ?? "");
      fd.append("urContact", form.urContact ?? "");
      fd.append("urResidence", form.urResidence ?? "");

      if (form.photoPelerin) fd.append("photoPelerin", form.photoPelerin);
      if (form.photoPasseport) fd.append("photoPasseport", form.photoPasseport);

      const me = getUserFromStorage();
      if (me) {
        fd.append("createdByName", me.name || me.email || "");
        fd.append("createdBy", me.name || me.email || "");
        if (me.id != null) fd.append("createdById", String(me.id));
      } else {
        fd.append("createdByName", "Anonyme");
      }

      const res = await fetch(`${API_BASE}/api/pelerins`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          msg = err?.message || err?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      toast("Pèlerin enregistré avec succès ✅", "success");
      reset();
    } catch (err) {
      console.error("[AjouterPelerin] save error:", err);
      toast(`Erreur d’enregistrement: ${err.message || "Échec."}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-6xl space-y-6 text-dyn">
      {/* ===== En-tête ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <h1 className="text-dyn-title text-slate-900">Ajouter un pèlerin</h1>
          <p className="mt-1 text-slate-600 text-dyn-sm">
            Remplis les informations ci-dessous. Les champs marqués{" "}
            <span className="font-semibold text-blue-700">Obligatoire</span>{" "}
            doivent être fournis.
          </p>
          {loadingVoyages && (
            <p className="mt-2 text-dyn-xs text-slate-500">Chargement des voyages…</p>
          )}
          {errVoyages && (
            <p className="mt-2 text-dyn-xs text-rose-600">Erreur: {errVoyages}</p>
          )}
        </div>
      </div>

      {/* ===== Bandeau photos ===== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
        <PhotoCard
          label="PHOTO PÈLERIN (JPG/PNG/PDF)"
          name="photoPelerin"
          file={form.photoPelerin}
          onFile={onFile}
        />
        <div className="order-first md:order-none md:col-auto">
          <Ribbon>Informations personnelles du pèlerin</Ribbon>
          <p className="mt-2 text-slate-600 text-dyn-sm">
            Les photos sont optionnelles mais recommandées pour les impressions.
          </p>
        </div>
        <PhotoCard
          label="PHOTO PASSEPORT (JPG/PNG/PDF)"
          name="photoPasseport"
          file={form.photoPasseport}
          onFile={onFile}
          align="right"
        />
      </div>

      {/* ===== Infos perso ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom du pèlerin" error={errors.nom}>
            <input
              name="nom"
              value={form.nom}
              onChange={onChange}
              className={inputCls(errors.nom)}
              placeholder="Ex: TRAORE"
            />
          </Field>
          <Field label="Prénoms du pèlerin" error={errors.prenoms}>
            <input
              name="prenoms"
              value={form.prenoms}
              onChange={onChange}
              className={inputCls(errors.prenoms)}
              placeholder="Ismaël O."
            />
          </Field>
          <Field label="Date de naissance" error={errors.dateNaissance}>
            <input
              type="date"
              name="dateNaissance"
              value={form.dateNaissance}
              onChange={onChange}
              className={inputCls(errors.dateNaissance)}
            />
          </Field>
          <Field label="Lieu de naissance">
            <input
              name="lieuNaissance"
              value={form.lieuNaissance}
              onChange={onChange}
              className={inputCls()}
              placeholder="Abidjan"
            />
          </Field>
          <Field label="Sexe" error={errors.sexe}>
            <select
              name="sexe"
              value={form.sexe}
              onChange={onChange}
              className={inputCls(errors.sexe)}
            >
              <option value="">Sélectionner</option>
              <option value="F">Féminin</option>
              <option value="M">Masculin</option>
            </select>
          </Field>
          <Field label="Adresse du pèlerin">
            <input
              name="adresse"
              value={form.adresse}
              onChange={onChange}
              className={inputCls()}
              placeholder="Adresse complète"
            />
          </Field>
          <Field
            label="Contacts du pèlerin"
            error={errors.contact}
            className="lg:col-span-2"
          >
            <input
              type="tel"
              name="contact"
              value={form.contact}
              onChange={onChange}
              className={inputCls(errors.contact)}
              placeholder="07 00 00 00 00"
            />
          </Field>
        </div>
      </div>

      {/* ===== Bloc Hajj ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
        <SectionTitle>Informations concernant le Hajj</SectionTitle>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Numéro de passeport" error={errors.numPasseport}>
            <input
              name="numPasseport"
              value={form.numPasseport}
              onChange={onChange}
              className={inputCls(errors.numPasseport)}
              placeholder="AA1234567"
              inputMode="text"
              autoCapitalize="characters"
              minLength={9}
              maxLength={9}
              pattern="^[A-Z0-9]{9}$"
              title="9 caractères alphanumériques (A–Z, 0–9)"
              required
            />
            <small className="block mt-1 text-slate-500 text-dyn-xs">
              Obligatoire · 9 caractères alphanumériques, automatiquement en MAJUSCULES.
            </small>
          </Field>

          {/* Voyage (depuis table voyages) */}
          <Field label="Voyage" error={errors.voyage}>
            <select
              name="voyage"
              value={form.voyage}
              onChange={onChange}
              className={inputCls(errors.voyage)}
              disabled={loadingVoyages || !nomsVoyage.length}
            >
              <option value="">{loadingVoyages ? "Chargement..." : "Sélectionner"}</option>
              {nomsVoyage.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {!nomsVoyage.length && !loadingVoyages && (
              <small className="text-dyn-xs text-slate-500">Aucun type de voyage disponible.</small>
            )}
          </Field>

          {/* Année (filtrée par voyage sélectionné) */}
          <Field label="Année voyage" error={errors.anneeVoyage}>
            <select
              name="anneeVoyage"
              value={form.anneeVoyage}
              onChange={onChange}
              className={inputCls(errors.anneeVoyage)}
              disabled={!form.voyage || !anneesForSelectedNom.length}
            >
              <option value="">{form.voyage ? "Sélectionner" : "Choisis d’abord un voyage"}</option>
              {anneesForSelectedNom.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            {form.voyage && !anneesForSelectedNom.length && (
              <small className="text-dyn-xs text-slate-500">
                Aucune année disponible pour {form.voyage}.
              </small>
            )}
          </Field>

          {/* Offres (toutes celles présentes en base, globales) */}
          <Field label="Offres" error={errors.offre}>
            <select
              name="offre"
              value={form.offre}
              onChange={onChange}
              className={inputCls(errors.offre)}
              disabled={!offresGlobales.length}
            >
              <option value="">
                {offresGlobales.length ? "Sélectionner" : "Aucune offre enregistrée"}
              </option>
              {offresGlobales.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {offresGlobales.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {offresGlobales.map((o) => (
                  <span
                    key={o}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-dyn-xs font-bold text-blue-700 ring-1 ring-blue-200"
                    title="Offre présente dans la table voyages"
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>
      </div>

      {/* ===== Urgence ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
        <SectionTitle>Personnes à contacter en cas d’urgence</SectionTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nom personne à contacter">
            <input
              name="urNom"
              value={form.urNom}
              onChange={onChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Prénoms personne à contacter">
            <input
              name="urPrenoms"
              value={form.urPrenoms}
              onChange={onChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Contact personne à contacter">
            <input
              type="tel"
              name="urContact"
              value={form.urContact}
              onChange={onChange}
              className={inputCls()}
              placeholder="Téléphone"
            />
          </Field>
          <Field label="Résidence personne à contacter">
            <input
              name="urResidence"
              value={form.urResidence}
              onChange={onChange}
              className={inputCls()}
            />
          </Field>
        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* TOAST simple */}
      {notice && (
        <div
          className={
            "fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-xs rounded-xl px-4 py-3 text-dyn-sm shadow-lg text-white " +
            (notice.type === "error" ? "bg-rose-600" : "bg-emerald-600")
          }
        >
          {notice.text}
        </div>
      )}
    </form>
  );
}

/* ---------- Helpers voyages ---------- */
function uniqueNoms(list) {
  const set = new Set();
  for (const v of list || []) if (v?.nom) set.add(String(v.nom).toUpperCase());
  return Array.from(set);
}
function yearsForNom(list, nom) {
  if (!nom) return [];
  const ys = new Set();
  for (const v of list || []) {
    if (String(v.nom).toUpperCase() === String(nom).toUpperCase() && Number.isFinite(Number(v.annee))) {
      ys.add(Number(v.annee));
    }
  }
  return Array.from(ys).sort((a, b) => b - a);
}
function parseOffres(txt) {
  if (!txt) return [];
  const parts = String(txt)
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

/* ---------- UI bits ---------- */
function Ribbon({ children }) {
  return (
    <div className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-dyn-sm font-extrabold uppercase tracking-wider text-blue-800">
      {children}
    </div>
  );
}
function SectionTitle({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-200 text-dyn-sm font-extrabold">
      {children}
    </div>
  );
}
function PhotoCard({ label, name, file, onFile, align = "left" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let obj = "";
    if (file) {
      obj = URL.createObjectURL(file);
      setUrl(obj);
    } else {
      setUrl("");
    }
    return () => { if (obj) URL.revokeObjectURL(obj); };
  }, [file]);

  const isPdf =
    file &&
    (file.type === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf"));
  const isImage = file && file.type?.startsWith("image/");

  return (
    <div className={align === "right" ? "md:ml-auto" : ""}>
      <div className="mx-auto grid aspect-[3/4] w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:w-44">
        {file ? (
          isPdf ? (
            <iframe src={url} title="Prévisualisation PDF" className="h-full w-full" frameBorder="0" />
          ) : isImage ? (
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-xs text-slate-500">
              <span>Fichier non affichable</span>
              <span className="truncate">{file.name}</span>
            </div>
          )
        ) : (
          <span className="self-center text-dyn-sm text-slate-400">Aperçu</span>
        )}
      </div>

      <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-dyn-sm font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100 sm:w-auto">
        {label}
        <input
          type="file"
          name={name}
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={onFile}
        />
      </label>

      {file && (
        <div className="mt-1 max-w-[12rem] truncate text-dyn-xs text-slate-500">
          {file.name}
        </div>
      )}
    </div>
  );
}
function Field({ label, error, children, className = "" }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="text-dyn-xs font-extrabold tracking-wide text-slate-700">
        {label} {error && <span className="font-normal text-rose-600">• {error}</span>}
      </span>
      {children}
    </label>
  );
}
function inputCls(hasError) {
  const base =
    "w-full rounded-xl border bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent";
  const normal = "border-slate-300 focus:ring-blue-300";
  const error = "border-rose-300 focus:ring-rose-300";
  return `${base} ${hasError ? error : normal}`;
}
