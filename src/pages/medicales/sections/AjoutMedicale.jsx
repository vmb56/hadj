// src/pages/medicales/sections/AjoutMedicale.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

/* ========= Config API ========= */
// On force directement l’API Render en HTTPS pour éviter le contenu mixte
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

// ❗ Si tu utilises exclusivement Authorization: Bearer (pas de cookies),
// il vaut mieux ne PAS envoyer withCredentials, ça évite beaucoup d’erreurs CORS.
const SEND_COOKIES = false;

const PASSPORT_LOOKUP_URL = `${API_BASE}/api/pelerins/by-passport`;
const MEDICALES_POST_URL = `${API_BASE}/api/medicales`;

/* ========= petit toast ========= */
function useToast() {
  const [msg, setMsg] = useState(null); // {text,type}
  const push = (text, type = "ok") => {
    setMsg({ text, type });
    clearTimeout(push._t);
    push._t = setTimeout(() => setMsg(null), 2200);
  };
  const Toast = () =>
    msg ? (
      <div
        className={
          "fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 text-sm shadow-xl text-white " +
          (msg.type === "err" ? "bg-rose-600" : "bg-emerald-600")
        }
      >
        {msg.text}
      </div>
    ) : null;
  return { push, Toast };
}

/* ========= helpers diag ========= */
function explainAxiosError(err) {
  // axios "Network Error" sans response = problème réseau/CORS/HTTPS mix.
  if (err?.response) {
    const data = err.response.data;
    return (
      data?.message ||
      data?.error ||
      `Erreur API (HTTP ${err.response.status})`
    );
  }
  if (err?.request) {
    // Requête envoyée mais pas de réponse (souvent CORS/HTTPS mixte)
    return "Requête envoyée mais sans réponse (CORS / HTTPS mix / pare-feu ?)";
  }
  return err?.message || "Erreur réseau inconnue.";
}

function useHttpsMixedContentWarning(push) {
  useEffect(() => {
    try {
      const pageIsHttps = window.location?.protocol === "https:";
      const apiIsHttp = /^http:\/\//i.test(API_BASE);
      if (pageIsHttps && apiIsHttp) {
        push(
          "Attention: Front en HTTPS mais API en HTTP — le navigateur bloque les requêtes (contenu mixte). Utilise une API en HTTPS.",
          "err"
        );
      }
    } catch {}
  }, [push]);
}

export default function AjoutMedicale() {
  const { push, Toast } = useToast();
  useHttpsMixedContentWarning(push);

  const [formData, setFormData] = useState({
    numeroCMAH: "",
    passeport: "",
    nom: "",
    prenoms: "",
    pouls: "",
    carnetVaccins: "",
    groupeSanguin: "",
    covid: "",
    poids: "",
    tension: "",
    vulnerabilite: "",
    diabete: "",
    maladieCardiaque: "",
    analysePsychiatrique: "",
    accompagnements: "",
    examenParaclinique: "",
    antecedents: "",
  });

  // --- États pour l'auto-remplissage par passeport
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [autofilled, setAutofilled] = useState(false);
  const debounceRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "passeport") {
      const v = value.replace(/\s+/g, "").toUpperCase();
      setAutofilled(false);
      setMatches([]);
      setFetchError("");
      return setFormData((f) => ({ ...f, passeport: v }));
    }
    if (name === "nom") {
      return setFormData((f) => ({ ...f, nom: value.toUpperCase() }));
    }
    setFormData((f) => ({ ...f, [name]: value }));
  }

  function handleCancel() {
    setFormData({
      numeroCMAH: "",
      passeport: "",
      nom: "",
      prenoms: "",
      pouls: "",
      carnetVaccins: "",
      groupeSanguin: "",
      covid: "",
      poids: "",
      tension: "",
      vulnerabilite: "",
      diabete: "",
      maladieCardiaque: "",
      analysePsychiatrique: "",
      accompagnements: "",
      examenParaclinique: "",
      antecedents: "",
    });
    setMatches([]);
    setAutofilled(false);
    setFetchError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.passeport || !/^[A-Z0-9]{5,15}$/.test(formData.passeport)) {
      push("Numéro de passeport invalide (5–15 alphanum.)", "err");
      return;
    }
    try {
      const token = getToken();
      const payload = {
        numero_cmah: formData.numeroCMAH || null,
        passeport: formData.passeport,
        nom: formData.nom || null,
        prenoms: formData.prenoms || null,
        pouls: formData.pouls || null,
        carnet_vaccins: formData.carnetVaccins || null,
        groupe_sanguin: formData.groupeSanguin || null,
        covid: formData.covid || null,
        poids: formData.poids || null,
        tension: formData.tension || null,
        vulnerabilite: formData.vulnerabilite || null,
        diabete: formData.diabete || null,
        maladie_cardiaque: formData.maladieCardiaque || null,
        analyse_psychiatrique: formData.analysePsychiatrique || null,
        accompagnements: formData.accompagnements || null,
        examen_paraclinique: formData.examenParaclinique || null,
        antecedents: formData.antecedents || null,
      };

      await axios.post(MEDICALES_POST_URL, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // ✅ n'envoie PAS les cookies si tu ne les utilises pas
        withCredentials: SEND_COOKIES,
        timeout: 15000,
      });

      push("Fiche médicale enregistrée ✅");
      handleCancel();
    } catch (err) {
      console.error("[POST /api/medicales]", err);
      const msg = explainAxiosError(err);
      push(msg, "err");
    }
  }

  // --- Debounce lookup par passeport
  useEffect(() => {
    const p = formData.passeport;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!p || p.length < 5) {
      setMatches([]);
      setSearching(false);
      setFetchError("");
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        setFetchError("");
        const token = getToken();
        const res = await axios.get(PASSPORT_LOOKUP_URL, {
          params: { passport: p },
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          withCredentials: SEND_COOKIES,
          timeout: 15000,
        });
        const payload = res?.data;
        let list = [];
        if (Array.isArray(payload)) list = payload;
        else if (payload && typeof payload === "object") list = [payload];
        setMatches(list);
        if (list.length === 1) {
          applyMatch(list[0]);
        } else {
          setAutofilled(false);
        }
      } catch (err) {
        console.error("[lookup passeport]", err);
        setFetchError(
          explainAxiosError(err) ||
            "Erreur lors de la recherche du passeport."
        );
        setMatches([]);
        setAutofilled(false);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.passeport]);

  function applyMatch(match) {
    setFormData((f) => ({
      ...f,
      nom: match?.nom ? String(match.nom).toUpperCase() : f.nom,
      prenoms: match?.prenoms ?? f.prenoms,
    }));
    setAutofilled(true);
  }

  function resetAutofill() {
    setAutofilled(false);
    setMatches([]);
  }

  return (
    <div className="medical-page">
      <Toast />
      <style>{`
        :root{
          --bg:#f8fafc;
          --bg-accent:rgba(191,219,254,.35);
          --card:#ffffff;
          --text:#0f172a;
          --muted:#475569;
          --border:#e2e8f0;
          --chip:#e2e8f0;
          --focus:#2563eb;
          --focus2:#60a5fa;
          --ok:#16a34a;
          --warn:#f59e0b;
          --err:#ef4444;
          --shadow:0 12px 30px rgba(2,6,23,.08);
        }
        .medical-page{
          min-height:100%;
          background:
            radial-gradient(1000px 700px at -10% 0%, var(--bg-accent) 0%, transparent 60%),
            radial-gradient(900px 600px at 110% -10%, rgba(96,165,250,.22) 0%, transparent 65%),
            var(--bg);
          color:var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial;
          padding: clamp(16px, 2.5vw, 28px);
        }
        .page-title{
          text-align:center;
          font-weight:900;
          letter-spacing:.3px;
          margin-bottom:20px;
          color:#1e40af;
          font-size:clamp(1.25rem,1.05rem + .9vw,1.75rem);
          text-transform:uppercase;
        }
        form{
          width:min(1200px,100%);
          margin:0 auto;
          background:var(--card);
          padding: clamp(18px, 2.2vw, 26px);
          border-radius:16px;
          border:1px solid var(--border);
          box-shadow:var(--shadow);
        }
        .grid{
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 1.6vw, 20px);
        }
        @media (max-width: 1000px){ .grid{grid-template-columns: repeat(2,1fr);} }
        @media (max-width: 700px){ .grid{grid-template-columns:1fr;} }

        label{
          display:block;
          font-weight:800;
          font-size:13px;
          color:#1e3a8a;
          text-transform:uppercase;
          letter-spacing:.4px;
          margin-bottom:6px;
        }
        input, select, textarea{
          width:100%;
          background:#ffffff;
          color:var(--text);
          border:1px solid var(--border);
          border-radius:12px;
          padding:12px 12px;
          font-size:15px;
          outline:none;
          transition:.15s ease;
        }
        input::placeholder, textarea::placeholder{ color:#94a3b8; }
        input:focus, select:focus, textarea:focus{
          border-color:#93c5fd;
          box-shadow:0 0 0 3px rgba(37,99,235,.18);
        }

        .hint{display:block;margin-top:6px;font-size:12px;color:#64748b;}
        .inline-note{
          margin-top:8px;font-size:12px;display:inline-flex;align-items:center;gap:8px;
          padding:8px 10px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;color:#0f172a;
        }
        .inline-note.success{ background:#ecfdf5; border-color:#bbf7d0; color:#065f46; }
        .inline-note.error{ background:#fef2f2; border-color:#fecaca; color:#7f1d1d; }

        .results{
          margin-top:8px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#ffffff;
        }
        .results button{
          width:100%;text-align:left;background:transparent;color:var(--text);border:0;
          padding:12px 12px;font-size:14px;cursor:pointer;
        }
        .results button:hover{background:#f1f5f9;}

        .actions{
          display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;margin-top: clamp(20px, 3vw, 28px);
        }
        .actions > *{flex:1 1 200px;}
        button{
          border:none;border-radius:12px;font-weight:800;letter-spacing:.4px;cursor:pointer;padding:12px 20px;
          font-size:15px;transition:.25s ease;
        }
        button.cancel{background:linear-gradient(135deg,#94a3b8,#64748b);color:#fff;}
        button.cancel:hover{filter:brightness(1.06);}
        button.submit{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;}
        button.submit:hover{filter:brightness(1.06);}

        .t-sm{font-size:14px;}
      `}</style>

      <h2 className="page-title">Informations médicales pèlerins</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid">
          {/* Ligne 1 */}
          <div>
            <label>Numéro du CMAH</label>
            <input
              name="numeroCMAH"
              value={formData.numeroCMAH}
              onChange={handleChange}
              placeholder="Ex: CMAH-2025-00123"
              autoComplete="off"
            />
          </div>

          <div>
            <label>Numéro Passeport</label>
            <input
              name="passeport"
              value={formData.passeport}
              onChange={handleChange}
              placeholder="Ex: 20AD24295 ou A12345678"
              inputMode="text"
              pattern="[A-Za-z0-9]{5,15}"
              maxLength={15}
              required
              aria-describedby="help-pass"
            />
            <small id="help-pass" className="hint">
              5 à 15 caractères alphanumériques, sans espace (converti en
              MAJUSCULES).
            </small>

            {searching && (
              <div className="inline-note t-sm">Recherche en cours…</div>
            )}
            {fetchError && (
              <div className="inline-note error t-sm">{fetchError}</div>
            )}

            {!searching && matches.length > 1 && (
              <div className="results">
                {matches.map((m) => (
                  <button
                    key={m.id || `${m.nom}-${m.prenoms}`}
                    type="button"
                    onClick={() => applyMatch(m)}
                    title="Appliquer ces informations"
                  >
                    {(m.num_passeport ||
                      m.passeport ||
                      formData.passeport) +
                      " — " +
                      (m.nom || "") +
                      " " +
                      (m.prenoms || "")}
                  </button>
                ))}
              </div>
            )}

            {autofilled && (
              <div className="inline-note success t-sm">
                Données récupérées (nom/prénoms préremplis).{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginLeft: 6,
                  }}
                  onClick={resetAutofill}
                >
                  Réinitialiser
                </span>
              </div>
            )}
          </div>

          {/* Ligne 2 */}
          <div>
            <label>Nom du pèlerin</label>
            <input
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="NOM (MAJUSCULES)"
              autoComplete="off"
            />
          </div>
          <div>
            <label>Prénoms du pèlerin</label>
            <input
              name="prenoms"
              value={formData.prenoms}
              onChange={handleChange}
              placeholder="Prénoms"
              autoComplete="off"
            />
          </div>
          <div>
            <label>Pouls</label>
            <input
              name="pouls"
              value={formData.pouls}
              onChange={handleChange}
              placeholder="Ex: 72 bpm"
            />
          </div>

          {/* Ligne 3 */}
          <div>
            <label>Carnet vaccins</label>
            <input
              name="carnetVaccins"
              value={formData.carnetVaccins}
              onChange={handleChange}
              placeholder="Oui / Non / Détails"
            />
          </div>
          <div>
            <label>Groupe sanguin</label>
            <input
              name="groupeSanguin"
              value={formData.groupeSanguin}
              onChange={handleChange}
              placeholder="Ex: O+, A-, AB+"
            />
          </div>
          <div>
            <label>Attestation Covid-19</label>
            <input
              name="covid"
              value={formData.covid}
              onChange={handleChange}
              placeholder="Oui / Non / Date"
            />
          </div>

          {/* Ligne 4 */}
          <div>
            <label>Poids</label>
            <input
              name="poids"
              value={formData.poids}
              onChange={handleChange}
              placeholder="Ex: 74 kg"
              inputMode="decimal"
            />
          </div>
          <div>
            <label>Tension artérielle</label>
            <input
              name="tension"
              value={formData.tension}
              onChange={handleChange}
              placeholder="Ex: 12/8"
            />
          </div>
          <div>
            <label>Vulnérabilité</label>
            <input
              name="vulnerabilite"
              value={formData.vulnerabilite}
              onChange={handleChange}
              placeholder="Ex: Âge, pathologie, etc."
            />
          </div>

          {/* Ligne 5 */}
          <div>
            <label>Diabète</label>
            <input
              name="diabete"
              value={formData.diabete}
              onChange={handleChange}
              placeholder="Oui / Non / Détails"
            />
          </div>
          <div>
            <label>Maladie cardiaque</label>
            <input
              name="maladieCardiaque"
              value={formData.maladieCardiaque}
              onChange={handleChange}
              placeholder="Oui / Non / Détails"
            />
          </div>
          <div>
            <label>Analyse psychiatrique</label>
            <input
              name="analysePsychiatrique"
              value={formData.analysePsychiatrique}
              onChange={handleChange}
              placeholder="Oui / Non / Détails"
            />
          </div>

          {/* Ligne 6 */}
          <div>
            <label>Accompagnements</label>
            <input
              name="accompagnements"
              value={formData.accompagnements}
              onChange={handleChange}
              placeholder="Ex: Assistance fauteuil, traducteur…"
            />
          </div>
          <div>
            <label>Examen paraclinique</label>
            <input
              name="examenParaclinique"
              value={formData.examenParaclinique}
              onChange={handleChange}
              placeholder="Analyses / Imagerie / Résultats"
            />
          </div>
          <div>
            <label>Antécédents</label>
            <input
              name="antecedents"
              value={formData.antecedents}
              onChange={handleChange}
              placeholder="Chirurgies, allergies, traitements…"
            />
          </div>
        </div>

        <div className="actions">
          <button type="button" className="cancel" onClick={handleCancel}>
            ANNULER
          </button>
          <button type="submit" className="submit">
            ENREGISTRER
          </button>
        </div>
      </form>
    </div>
  );
}
