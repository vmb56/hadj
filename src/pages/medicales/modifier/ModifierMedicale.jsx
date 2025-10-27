// src/pages/medicales/ModifierMedicale.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/* ========= Config API ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ========= UI: mini toast ========= */
function useToast() {
  const [msg, setMsg] = useState(null); // {text,type}
  const push = (text, type="ok") => {
    setMsg({ text, type });
    clearTimeout(push._t);
    push._t = setTimeout(() => setMsg(null), 2300);
  };
  const Toast = () =>
    msg ? (
      <div
        className={
          "fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-xs rounded-xl px-4 py-3 text-sm shadow-lg text-white " +
          (msg.type === "err" ? "bg-rose-600" : "bg-emerald-600")
        }
      >
        {msg.text}
      </div>
    ) : null;
  return { push, Toast };
}

/* ========= Helpers mappage backend ⇄ front ========= */
function normalize(row = {}) {
  return {
    id: row.id ?? null,
    numeroCMAH: row.numero_cmah ?? row.numeroCMAH ?? "",
    passeport: row.passeport ?? "",
    nom: row.nom ?? "",
    prenoms: row.prenoms ?? "",
    groupeSanguin: row.groupe_sanguin ?? row.groupeSanguin ?? "",
    poids: row.poids ?? "",
    tension: row.tension ?? "",
    pouls: row.pouls ?? "",
    diabete: row.diabete ?? "",
    maladieCardiaque: row.maladie_cardiaque ?? row.maladieCardiaque ?? "",
    covid: row.covid ?? "",
    vulnerabilite: row.vulnerabilite ?? "",
    examenParaclinique: row.examen_paraclinique ?? row.examenParaclinique ?? "",
    antecedents: row.antecedents ?? "",
    accompagnements: row.accompagnements ?? "",
    analysePsychiatrique: row.analyse_psychiatrique ?? row.analysePsychiatrique ?? "",
  };
}
function toPayload(f) {
  return {
    numero_cmah: f.numeroCMAH || null,
    passeport: (f.passeport || "").toUpperCase() || null,
    nom: f.nom || null,
    prenoms: f.prenoms || null,
    groupe_sanguin: f.groupeSanguin || null,
    poids: f.poids || null,
    tension: f.tension || null,
    pouls: f.pouls || null,
    diabete: f.diabete || null,
    maladie_cardiaque: f.maladieCardiaque || null,
    covid: f.covid || null,
    vulnerabilite: f.vulnerabilite || null,
    examen_paraclinique: f.examenParaclinique || null,
    antecedents: f.antecedents || null,
    accompagnements: f.accompagnements || null,
    analyse_psychiatrique: f.analysePsychiatrique || null,
  };
}

/* ========= Composant ========= */
export default function ModifierMedicale() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const { row } = location.state || {};
  const passedId = row?.id ?? params?.id;

  const [form, setForm] = useState(normalize());
  const [loading, setLoading] = useState(!!passedId && !row);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const { push, Toast } = useToast();

  // Modal de confirmation + bandeau succès
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  useEffect(() => {
    if (row) {
      setForm(normalize(row));
      setLoading(false);
      return;
    }
    if (!passedId) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/medicales/${passedId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const j = await res.json(); msg = j?.message || msg; } catch {}
          throw new Error(msg);
        }
        const j = await res.json();
        setForm(normalize(j));
      } catch (e) {
        setErr(e.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [passedId, row]);

  function ch(e) {
    const { name, value } = e.target;
    if (name === "passeport") {
      return setForm((f) => ({ ...f, passeport: value.replace(/\s+/g, "").toUpperCase() }));
    }
    if (name === "nom") {
      return setForm((f) => ({ ...f, nom: value.toUpperCase() }));
    }
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate(f) {
    const e = {};
    if (!f.passeport || !/^[A-Z0-9]{5,15}$/.test(f.passeport)) e.passeport = "Passeport invalide (5–15 alphanum.).";
    if (!f.nom) e.nom = "Nom requis.";
    if (!f.prenoms) e.prenoms = "Prénoms requis.";
    return e;
  }

  // 1) Clic "Enregistrer" => on ouvre la modale de confirmation
  function onSubmitOpenConfirm(e) {
    e.preventDefault();
    const ee = validate(form);
    if (Object.keys(ee).length) {
      push(Object.values(ee)[0], "err");
      return;
    }
    setConfirmOpen(true);
  }

  // 2) Si confirmé => on met à jour
  async function doUpdate() {
    try {
      setSaving(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/medicales/${passedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(toPayload(form)),
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }

      // Notification (toast + bandeau)
      push("Fiche médicale mise à jour ✅");
      setSuccessBanner(true);
      setTimeout(() => setSuccessBanner(false), 2500);

      // Redirection légère (après une très courte pause pour voir le toast)
      setTimeout(() => navigate("/medicale/liste", { replace: true }), 300);
    } catch (e2) {
      push(e2.message || "Échec de la mise à jour", "err");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  const subtitle = useMemo(() => {
    if (loading) return "Chargement…";
    if (err) return err;
    return "Mets à jour les informations médicales du pèlerin.";
  }, [loading, err]);

  return (
    <div className="space-y-6 text-dyn">
      <Toast />

      {/* ===== En-tête / ruban ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <h2 className="text-dyn-title font-extrabold text-slate-900">Modifier la fiche médicale</h2>
          <p className={"mt-1 text-dyn-sm " + (err ? "text-rose-600" : "text-slate-600")}>{subtitle}</p>

          {successBanner && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-200 text-dyn-sm font-extrabold">
              Modifié avec succès
            </div>
          )}
        </div>
      </div>

      {/* ===== Formulaire ===== */}
      <form onSubmit={onSubmitOpenConfirm} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <fieldset disabled={loading || saving} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Base */}
          <Text label="Numéro CMAH" name="numeroCMAH" value={form.numeroCMAH} onChange={ch} />
          <Text label="N° Passeport" name="passeport" value={form.passeport} onChange={ch} placeholder="A12345678" />
          <Text label="Nom" name="nom" value={form.nom} onChange={ch} placeholder="NOM (MAJUSCULES)" />
          <Text label="Prénoms" name="prenoms" value={form.prenoms} onChange={ch} />
          <Text label="Groupe sanguin" name="groupeSanguin" value={form.groupeSanguin} onChange={ch} placeholder="O+, A-, AB+" />
          <Text label="Poids" name="poids" value={form.poids} onChange={ch} placeholder="74 kg" />
          <Text label="Tension" name="tension" value={form.tension} onChange={ch} placeholder="12/8" />
          <Text label="Pouls" name="pouls" value={form.pouls} onChange={ch} placeholder="72 bpm" />

          <Select label="Diabète" name="diabete" value={form.diabete} onChange={ch} options={["Oui","Non"]} />
          <Select label="Maladie cardiaque" name="maladieCardiaque" value={form.maladieCardiaque} onChange={ch} options={["Oui","Non"]} />
          <Select label="Covid-19" name="covid" value={form.covid} onChange={ch} options={["Négatif","Positif","Vacciné"]} />
          <Text label="Vulnérabilité" name="vulnerabilite" value={form.vulnerabilite} onChange={ch} placeholder="Âge, pathologie…" />

          <Area label="Examens paracliniques" name="examenParaclinique" value={form.examenParaclinique} onChange={ch} />
          <Area label="Antécédents" name="antecedents" value={form.antecedents} onChange={ch} />
          <Area label="Accompagnements" name="accompagnements" value={form.accompagnements} onChange={ch} />
          <Area label="Analyse psychiatrique" name="analysePsychiatrique" value={form.analysePsychiatrique} onChange={ch} />
        </fieldset>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>

      {/* ===== Modale de confirmation ===== */}
      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doUpdate}
          loading={saving}
          form={form}
        />
      )}
    </div>
  );
}

/* ========= Inputs ========= */
function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-dyn-xs font-extrabold tracking-wide text-slate-700">{label}</span>
      {children}
    </label>
  );
}
function Text(props) {
  return (
    <Field label={props.label}>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
      />
    </Field>
  );
}
function Select({ label, options = [], ...props }) {
  return (
    <Field label={label}>
      <select
        {...props}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300"
      >
        <option value="">Sélectionner…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}
function Area(props) {
  return (
    <Field label={props.label}>
      <textarea
        {...props}
        rows={2}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-dyn-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-300 resize-none"
      />
    </Field>
  );
}

/* ========= Modale de confirmation ========= */
function ConfirmModal({ onCancel, onConfirm, loading, form }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 h-full w-full p-2 sm:p-4 grid">
        <div
          role="dialog"
          aria-modal="true"
          className="
            m-auto sm:m-0 sm:ml-auto
            w-full sm:w-[min(560px,95vw)]
            bg-white border border-slate-200 shadow-2xl
            rounded-2xl p-5
          "
        >
          <h4 className="text-lg font-extrabold text-slate-900">Confirmer la modification</h4>
          <p className="mt-2 text-slate-600 text-sm">
            Voulez-vous vraiment enregistrer les modifications pour{" "}
            <span className="font-semibold text-slate-900">
              {form.nom} {form.prenoms}
            </span>{" "}
            (passeport <span className="font-mono">{form.passeport}</span>) ?
          </p>

          <div className="mt-4 rounded-xl bg-blue-50 ring-1 ring-blue-200 p-3 text-sm text-blue-900">
            <div className="font-bold mb-1">Récapitulatif rapide</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div><span className="text-slate-500">Groupe :</span> {form.groupeSanguin || "—"}</div>
              <div><span className="text-slate-500">Poids :</span> {form.poids || "—"}</div>
              <div><span className="text-slate-500">Tension :</span> {form.tension || "—"}</div>
              <div><span className="text-slate-500">Pouls :</span> {form.pouls || "—"}</div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
