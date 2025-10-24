// src/pages/pelerins/AjouterPelerin.jsx
import React, { useMemo, useState } from "react";

/* ========= Config API ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

/* ========= Récup user (sans imposer le token) ========= */
const USER_KEYS = ["bmvt_user", "bmvt_me", "user"]; // on couvre plusieurs clés possibles
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
  const [notice, setNotice] = useState(null); // {text,type}

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

  // petite aide si ton back préfère l’ISO pour la date
  function normalizeDateStr(s) {
    if (!s) return "";
    // input type="date" renvoie YYYY-MM-DD -> c’est déjà parfait.
    return s;
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

      // ---- Construction du FormData (ne pas fixer Content-Type) ----
      const fd = new FormData();

      // Champs attendus par le backend /api/pelerins (multipart)
      // → les noms de champs correspondent exactement à ceux de ton formulaire
      fd.append("nom", form.nom ?? "");
      fd.append("prenoms", form.prenoms ?? "");
      fd.append("dateNaissance", normalizeDateStr(form.dateNaissance));
      fd.append("lieuNaissance", form.lieuNaissance ?? "");
      fd.append("sexe", form.sexe ?? "");
      fd.append("adresse", form.adresse ?? "");
      fd.append("contact", form.contact ?? "");
      fd.append("numPasseport", form.numPasseport ?? "");
      fd.append("offre", form.offre ?? "");
      fd.append("voyage", form.voyage ?? "");
      fd.append("anneeVoyage", form.anneeVoyage ?? "");
      fd.append("urNom", form.urNom ?? "");
      fd.append("urPrenoms", form.urPrenoms ?? "");
      fd.append("urContact", form.urContact ?? "");
      fd.append("urResidence", form.urResidence ?? "");

      // Fichiers — les clés doivent matcher celles que ton back attend dans multer.fields([...])
      if (form.photoPelerin)  fd.append("photoPelerin", form.photoPelerin);
      if (form.photoPasseport) fd.append("photoPasseport", form.photoPasseport);

      // Infos utilisateur connecté (sans middleware, juste incluses dans le payload)
      const me = getUserFromStorage();
      if (me) {
        // couvre plusieurs convention côté back
        fd.append("createdByName", me.name || me.email || "");
        fd.append("createdBy", me.name || me.email || "");      // alt
        if (me.id != null) fd.append("createdById", String(me.id));
      } else {
        fd.append("createdByName", "Anonyme");
      }

      // ---- Appel API (AUCUN header 'Content-Type' et PAS d'Authorization) ----
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

      // Si le backend renvoie l’objet créé, tu peux le récupérer :
      // const { ok, item } = await res.json();

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
      {/* ===== En-tête / ruban ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <h1 className="text-dyn-title text-slate-900">Ajouter un pèlerin</h1>
          <p className="mt-1 text-slate-600 text-dyn-sm">
            Remplis les informations ci-dessous. Les champs marqués{" "}
            <span className="font-semibold text-blue-700">Obligatoire</span>{" "}
            doivent être fournis.
          </p>
        </div>
      </div>

      {/* ===== Bandeau photos + intro ===== */}
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
          <p className="mt-2 text-slate-600 text-dyn-sm">
            Les photos sont optionnelles mais recommandées pour les impressions.
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

      {/* ===== Bloc : Informations personnelles ===== */}
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

      {/* ===== Bloc : Hajj ===== */}
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
            />
          </Field>
          <Field label="Offres">
            <select
              name="offre"
              value={form.offre}
              onChange={onChange}
              className={inputCls()}
            >
              <option value="">Sélectionner</option>
              <option value="standard">Standard</option>
              <option value="confort">Confort</option>
              <option value="premium">Premium</option>
            </select>
          </Field>
          <Field label="Voyage">
            <select
              name="voyage"
              value={form.voyage}
              onChange={onChange}
              className={inputCls()}
            >
              <option value="">Sélectionner</option>
              <option value="vol">Vol</option>
              <option value="bus">Bus</option>
              <option value="mixte">Mixte</option>
            </select>
          </Field>
          <Field label="Année voyage" error={errors.anneeVoyage}>
            <select
              name="anneeVoyage"
              value={form.anneeVoyage}
              onChange={onChange}
              className={inputCls(errors.anneeVoyage)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ===== Bloc : Urgence ===== */}
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

function PhotoCard({ label, name, file, onFile, previewUrl, align = "left" }) {
  return (
    <div className={align === "right" ? "md:ml-auto" : ""}>
      <div className="mx-auto grid aspect-[3/4] w-40 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:w-44">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-dyn-sm text-slate-400">Aperçu</span>
        )}
      </div>
      <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-dyn-sm font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100 sm:w-auto">
        {label}
        <input type="file" name={name} accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {file && (
        <div className="mt-1 max-w-[11rem] truncate text-dyn-xs text-slate-500">{file.name}</div>
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
