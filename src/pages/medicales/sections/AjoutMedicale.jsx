// src/pages/medicales/sections/AjoutMedicale.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const PASSPORT_LOOKUP_URL =
  "https://ton-backend-hadj.onrender.com/api/pelerins/by-passport"; // ← à adapter

export default function AjoutMedicale() {
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
  const [matches, setMatches] = useState([]); // plusieurs résultats éventuels
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.passeport || !/^[A-Z0-9]{5,15}$/.test(formData.passeport)) {
      alert("Numéro de passeport invalide (5 à 15 caractères alphanumériques).");
      return;
    }
    console.log("✅ Données médicales enregistrées :", formData);
    alert("Enregistrement réussi !");
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
        // GET /api/pelerins/by-passport?passport=XXXX
        const res = await axios.get(PASSPORT_LOOKUP_URL, {
          params: { passport: p },
        });
        // backend peut renvoyer un objet ou un tableau → on uniformise en tableau
        const payload = res?.data;
        let list = [];
        if (Array.isArray(payload)) list = payload;
        else if (payload && typeof payload === "object") list = [payload];
        else list = [];

        setMatches(list);

        // si un seul match → auto-remplir direct
        if (list.length === 1) {
          applyMatch(list[0]);
        } else {
          setAutofilled(false);
        }
      } catch (err) {
        console.error("[lookup passeport]", err);
        setFetchError(
          err?.response?.data?.message ||
            err?.message ||
            "Erreur lors de la recherche du passeport."
        );
        setMatches([]);
        setAutofilled(false);
      } finally {
        setSearching(false);
      }
    }, 500); // 500ms de debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.passeport]);

  function applyMatch(match) {
    // On préremplit nom/prénoms si disponibles
    setFormData((f) => ({
      ...f,
      nom: match?.nom ? String(match.nom).toUpperCase() : f.nom,
      prenoms: match?.prenoms ?? f.prenoms,
      // Si tu veux pré-remplir d’autres champs (adresse, contact…), ajoute-les ici :
      // exemple: groupeSanguin: match.groupeSanguin ?? f.groupeSanguin,
    }));
    setAutofilled(true);
  }

  function resetAutofill() {
    setAutofilled(false);
    setMatches([]);
    // on ne touche pas au passeport saisi
  }

  return (
    <div className="medical-page">
      <style>{`
        :root {
          --bg: #022b2e;
          --card: #08363a;
          --border: #0d4d52;
          --text: #f1f5f9;
          --accent: #22c55e;
          --muted: #94a3b8;
          --warn: #f43f5e;
          --info: #38bdf8;
        }
        .medical-page {
          min-height: 100%;
          background: var(--bg);
          color: var(--text);
          font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
          padding: clamp(16px, 2.5vw, 28px);
        }
        h2 {
          text-align: center;
          color: #ef4444;
          letter-spacing: .8px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        form {
          width: min(1200px, 100%);
          margin: 0 auto;
          background: var(--card);
          padding: clamp(16px, 2.2vw, 24px);
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,.35);
          border: 1px solid var(--border);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 1.6vw, 20px);
        }
        @media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
        label {
          display: block;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
          color: var(--muted);
        }
        input, select, textarea {
          width: 100%;
          background: #0a4045;
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          outline: none;
          transition: 0.2s ease;
        }
        input::placeholder, textarea::placeholder { color: #9fb3bd; opacity: .75; }
        input:focus, select:focus, textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
        }
        .hint { display:block; margin-top:6px; font-size:12px; color:#cbd5e1; opacity:.85; }

        .inline-note {
          margin-top: 6px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(56,189,248,.12);
          border: 1px solid rgba(56,189,248,.35);
          color: #e0f2fe;
        }
        .inline-note.success {
          background: rgba(34,197,94,.12);
          border-color: rgba(34,197,94,.35);
          color: #dcfce7;
        }
        .inline-actions {
          display: inline-flex;
          gap: 10px;
          margin-left: 8px;
        }
        .link {
          color: #93c5fd;
          cursor: pointer;
          text-decoration: underline;
        }

        .results {
          margin-top: 8px;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          background: #0a4045;
        }
        .results button {
          width: 100%;
          text-align: left;
          background: transparent;
          color: var(--text);
          border: 0;
          padding: 10px 12px;
          font-size: 14px;
          cursor: pointer;
        }
        .results button:hover {
          background: rgba(255,255,255,.06);
        }

        .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-top: clamp(18px, 3vw, 28px);
        }
        .actions > * { flex: 1 1 180px; }
        button {
          border: none;
          border-radius: 10px;
          font-weight: 700;
          letter-spacing: .4px;
          cursor: pointer;
          padding: 12px 24px;
          font-size: 15px;
          transition: 0.3s;
        }
        button.cancel { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; }
        button.cancel:hover { filter: brightness(1.06); }
        button.submit { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
        button.submit:hover { filter: brightness(1.06); }
      `}</style>

      <h2>INFORMATIONS MÉDICALES PÈLERINS</h2>

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
              5 à 15 caractères alphanumériques, sans espace (converti en MAJUSCULES).
            </small>

            {/* États de recherche */}
            {searching && (
              <div className="inline-note" style={{ marginTop: 8 }}>
                Recherche en cours…
              </div>
            )}
            {fetchError && (
              <div className="inline-note" style={{ marginTop: 8 }}>
                {fetchError}
              </div>
            )}

            {/* Plusieurs résultats → liste à choisir */}
            {!searching && matches.length > 1 && (
              <div className="results">
                {matches.map((m) => (
                  <button
                    key={m.id || `${m.nom}-${m.prenoms}`}
                    type="button"
                    onClick={() => applyMatch(m)}
                    title="Appliquer ces informations"
                  >
                    {m.passeport || formData.passeport} — {m.nom} {m.prenoms}
                  </button>
                ))}
              </div>
            )}

            {/* Auto-remplissage confirmé */}
            {autofilled && (
              <div className="inline-note success">
                Données récupérées (nom/prénoms préremplis).
                <span className="inline-actions">
                  <span className="link" onClick={resetAutofill}>
                    Réinitialiser
                  </span>
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
