// src/pages/medicales/sections/ImpressionMedicale.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../../pelerins/Logo.png";

/* ========= Config API ========= */
// On force directement l’API Render en HTTPS pour éviter le contenu mixte
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ========= Helpers ========= */
// Construit une URL absolue pour les fichiers stockés par l’API (ex: /uploads/…)
function mediaURL(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = API_BASE.replace(/\/+$/, "");
  const rel  = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("fr-FR");
}

// Normalise une ligne "médicale" renvoyée par /api/medicales
function normalizeMed(row = {}) {
  return {
    idInfo: row.id ?? null,
    idPelerin: row.pelerin_id ?? null,
    numeroCMAH: row.numero_cmah ?? "",
    passport: row.passeport ?? "",
    nom: row.nom ?? "",
    prenoms: row.prenoms ?? "",
    // Constantes et champs médicaux
    pouls: row.pouls ?? "",
    tension: row.tension ?? "",
    poids: row.poids ?? "",
    carnetVaccins: row.carnet_vaccins ?? "",
    groupeSanguin: row.groupe_sanguin ?? "",
    covid: row.covid ?? "",
    vulnerabilite: row.vulnerabilite ?? "",
    diabete: row.diabete ?? "",
    maladieCardiaque: row.maladie_cardiaque ?? "",
    analysePsychiatrique: row.analyse_psychiatrique ?? "",
    accompagnements: row.accompagnements ?? "",
    examenParaclinique: row.examen_paraclinique ?? "",
    antecedents: row.antecedents ?? "",
    createdAt: row.created_at ?? null,
  };
}

// Normalise une fiche pèlerin pour l’aperçu / impression (GET /api/pelerins/:id)
function normalizePelerin(row = {}) {
  return {
    photo: mediaURL(row.photo_pelerin_path || ""),
    dateNaissance: row.date_naissance || "",
    lieuNaissance: row.lieu_naissance || "",
    adresse: row.adresse || "",
    contacts: row.contact || "",
    sexe: row.sexe || "",
    offre: row.offre || "",
    nomVoyage: row.voyage || "",
    anneeVoyage: row.annee_voyage || "",
    hotel: row.hotel || "", // si tu ajoutes ce champ plus tard
    employeEnregistreur: row.created_by_name || "",
  };
}

/* ====================== Composant principal ====================== */
export default function ImpressionMedicale() {
  // ✅ Recherche UNIQUEMENT par N° de passeport
  const [qPassport, setQPassport] = useState("");

  // Liste médicale (API), sélection et enrichissement
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Cache "pèlerin" par ID pour éviter refetch à chaque clic
  const [pelerinsCache, setPelerinsCache] = useState({});
  const [loadingPelerin, setLoadingPelerin] = useState(false);

  const selectedMed = useMemo(
    () => data.find((x) => x.idInfo === selectedId) || null,
    [data, selectedId]
  );
  const selectedPel = selectedMed?.idPelerin ? pelerinsCache[selectedMed.idPelerin] : null;

  const printRef = useRef(null);

  /* ====== Chargement initial : on récupère toute la liste (sans filtre) ====== */
  useEffect(() => {
    fetchAll();
  }, []);

  // Liste complète (GET /api/medicales) — utile quand on “Efface”
  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const token = getToken();
      const url = new URL(`${API_BASE}/api/medicales`);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      const payload = await res.json();
      const list = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = list.map(normalizeMed);
      setData(normalized);
      setSelectedId(null);
    } catch (e) {
      setErr(e.message || "Échec du chargement");
      setData([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Recherche stricte par passeport (GET /api/medicales/by-passport?passport=)
  async function fetchByPassport(pass) {
    const clean = (pass || "").replace(/\s+/g, "").toUpperCase();
    if (!clean) return fetchAll();

    setLoading(true);
    setErr("");
    try {
      const token = getToken();
      const url = new URL(`${API_BASE}/api/medicales/by-passport`);
      url.searchParams.set("passport", clean);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      const payload = await res.json();
      // la route renvoie {items: [...]}
      const list = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = list.map(normalizeMed);
      setData(normalized);
      setSelectedId(normalized.length === 1 ? normalized[0].idInfo : null);
    } catch (e) {
      setErr(e.message || "Échec de la recherche");
      setData([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  // Lorsqu’on choisit une ligne, on tente de charger le pelerin lié (si pas en cache)
  useEffect(() => {
    (async () => {
      if (!selectedMed?.idPelerin || pelerinsCache[selectedMed.idPelerin]) return;
      try {
        setLoadingPelerin(true);
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/pelerins/${selectedMed.idPelerin}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) return; // on ne bloque pas l’UI
        const row = await res.json();
        setPelerinsCache((prev) => ({
          ...prev,
          [selectedMed.idPelerin]: normalizePelerin(row),
        }));
      } finally {
        setLoadingPelerin(false);
      }
    })();
  }, [selectedMed, pelerinsCache]);

  // ✅ Soumission => cherche uniquement par passeport
  function handleSearch(e) {
    e.preventDefault();
    fetchByPassport(qPassport);
  }

  function handleClear() {
    setQPassport("");
    fetchAll();
  }

  function handlePrint() {
    if (!selectedMed) {
      alert("Sélectionne une fiche médicale avant d’imprimer.");
      return;
    }
    requestAnimationFrame(() => window.print());
  }

  // Fusion (médicale + pelerin si dispo)
  const selected = useMemo(() => {
    if (!selectedMed) return null;
    const pel = selectedPel || {};
    return {
      ...selectedMed,
      photo: pel.photo || "",
      dateNaissance: pel.dateNaissance || "",
      lieuNaissance: pel.lieuNaissance || "",
      adresse: pel.adresse || "",
      contacts: pel.contacts || "",
      sexe: pel.sexe || "",
      offre: pel.offre || "",
      nomVoyage: pel.nomVoyage || "",
      anneeVoyage: pel.anneeVoyage || "",
      hotel: pel.hotel || "",
      employeEnregistreur: pel.employeEnregistreur || "",
    };
  }, [selectedMed, selectedPel]);

  return (
    <div className="ip-page">
      {/* ====== Styles (thème bleu & blanc moderne) ====== */}
      <style>{`
        :root{
          --bg:#f8fafc;
          --card:#ffffff;
          --muted:#64748b;
          --text:#0f172a;
          --accent:#2563eb;
          --accent-2:#60a5fa;
          --ok:#16a34a;
          --warn:#f59e0b;
          --chip:#e2e8f0;
          --border:#e2e8f0;
          --row:rgba(15,23,42,.02);
          --row-alt:rgba(15,23,42,.05);
          --shadow:0 10px 30px rgba(2,6,23,.08);
        }
        .ip-page{
          min-height:100dvh;
          background:
            radial-gradient(1000px 600px at 95% -10%, rgba(96,165,250,.26) 0%, transparent 65%),
            radial-gradient(1000px 700px at -10% 10%, rgba(191,219,254,.4) 0%, transparent 60%),
            var(--bg);
          padding:24px;
          color:var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial;
        }
        .ip-shell{max-width:1280px;margin:0 auto;}
        .ip-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;}
        .ip-title{display:flex;align-items:center;gap:12px;}
        .ip-badge{
          background: linear-gradient(135deg,#3b82f6 0%,#22c55e 100%);
          color: white; font-weight: 900; letter-spacing: .4px;
          padding: 8px 12px; border-radius: 999px; font-size: 12px;
          box-shadow: var(--shadow);
        }

        .ip-card{
          background: var(--card);
          border:1px solid var(--border);
          border-radius:16px;
          box-shadow: var(--shadow);
        }

        .ip-controls{padding:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
        .ip-input{
          background:#fff;border:1px solid var(--border);color:var(--text);
          padding:10px 12px;border-radius:12px;outline:none;width:260px;
        }
        .ip-input:focus{box-shadow:0 0 0 2px rgba(37,99,235,.25);border-color:#93c5fd;}

        .ip-btn{
          border:1px solid var(--border); color:var(--text);
          padding:10px 14px;border-radius:12px;background:#fff;cursor:pointer;font-weight:700;
        }
        .ip-btn:hover{background:#f8fafc;}
        .ip-btn.primary{background: linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; border-color:transparent;}
        .ip-btn.primary:hover{filter:brightness(1.05);}
        .ip-btn.print{background: linear-gradient(135deg,#38bdf8,#2563eb); color:#fff; border-color:transparent;}
        .ip-btn.print:hover{filter:brightness(1.05);}
        .ip-btn.ghost{background:transparent;}

        .ip-layout{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;}
        @media (max-width:1100px){.ip-layout{grid-template-columns:1fr;}}

        .ip-table{width:100%;border-collapse:collapse;overflow:hidden;border-radius:16px;}
        .ip-table thead th{
          text-align:left;padding:12px 12px;font-size:12px;letter-spacing:.4px;color:#1e3a8a;
          background:#eff6ff;border-bottom:1px solid var(--border);text-transform:uppercase;
        }
        .ip-table tbody td{padding:12px;font-size:14px;border-bottom:1px solid #e5e7eb;}
        .ip-table tbody tr{background:var(--row);}
        .ip-table tbody tr:nth-child(even){background:var(--row-alt);}
        .ip-table tbody tr:hover{background:#f1f5f9;cursor:pointer;}
        .ip-table tr.selected{background:linear-gradient(90deg,#dbeafe,#bfdbfe)!important;color:#0f172a;}

        .chip{display:inline-flex;align-items:center;gap:6px;background:var(--chip);padding:6px 10px;border-radius:999px;font-size:12px;}

        .ip-aside{padding:16px;}
        .ip-preview{background:#ffffff;border:1px solid var(--border);border-radius:14px;padding:14px;box-shadow:var(--shadow);}

        .print-area{margin-top:18px;}
        .print-card{
          width:210mm;background:white;color:#111;padding:18mm;
          border-radius:4px;border:1px solid #e5e7eb;position:relative;box-sizing:border-box;
        }
        .wm{
          position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-8deg);
          font-weight:900;font-size:120px;color: rgba(37,99,235,0.08);letter-spacing: 2px;user-select:none;pointer-events:none;
        }
        .ph-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .brand{display:flex;align-items:center;gap:12px;}
        .brand .logo{width:72px;height:72px;object-fit:contain;}
        .doc-title{font-size:20px;font-weight:900;}
        .doc-sub{color:#374151;font-size:13px;margin-top:2px;}
        .meta{text-align:right;font-size:12px;color:#6b7280;}
        .section{background:#dbeafe;font-weight:800;padding:6px 10px;margin:10px 0;color:#111;border:1px solid #bfdbfe;}
        .row{display:flex;gap:8px;margin:6px 0;}
        .label{width:230px;font-weight:700;color:#1f2937;}
        .value{flex:1;}

        .two-col{display:flex;gap:20px;}
        .col{flex:1;}
        .right-photo{width:120px;text-align:center;}

        .footer{
          margin-top:16px;padding-top:10px;border-top:1px dashed #d1d5db;
          display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;
        }
        .signature{height:56px;display:block;}

        /* Impression */
        @media print{
          body *{visibility:hidden;}
          .print-area, .print-area *{visibility:visible;}
          .print-area{position:absolute;inset:0;margin:0;}
          @page{size:A4;margin:10mm;}
        }

        .dyn-title{font-size:clamp(1.35rem,1.2rem + .8vw,1.65rem);}
        .dyn-sm{font-size:clamp(.95rem,.9rem + .2vw,1.05rem);}
      `}</style>

      <div className="ip-shell">
        <div className="ip-header">
          <div className="ip-title">
            <span className="ip-badge">BMVT</span>
            <div>
              <div className="dyn-title" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
                Impressions – Fiche Médicale
              </div>
              <div className="dyn-sm" style={{ color: "var(--muted)" }}>
                Recherche par N° de passeport · Sélection · Impression A4
              </div>
            </div>
          </div>

          <div className="chip" title="Total fiches">
            <span>🧾</span>
            <strong>{data.length}</strong> fiches
          </div>
        </div>

        {/* ✅ Barre de recherche passeport uniquement */}
        <div className="ip-card">
          <form className="ip-controls" onSubmit={handleSearch}>
            <input
              className="ip-input"
              placeholder="Numéro de passeport (ex: AA1234567)"
              value={qPassport}
              onChange={(e) => setQPassport(e.target.value.replace(/\s+/g, "").toUpperCase())} // normalise
              inputMode="text"
            />
            <button type="submit" className="ip-btn primary" disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </button>
            <button type="button" className="ip-btn" onClick={handleClear} disabled={loading}>
              Effacer
            </button>
            <button type="button" className="ip-btn print" onClick={handlePrint}>
              Imprimer la fiche
            </button>
            <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}>
              {selectedMed
                ? `Sélectionné : ${selectedMed.nom} ${selectedMed.prenoms}${loadingPelerin ? " (infos pèlerin...)" : ""}`
                : err
                ? err
                : `${data.length} résultat(s)`}
            </div>
          </form>
        </div>

        {/* Layout principal */}
        <div className="ip-layout" style={{ marginTop: 16 }}>
          {/* Tableau (liste médicale) */}
          <div className="ip-card" style={{ padding: 12 }}>
            <table className="ip-table">
              <thead>
                <tr>
                  <th>ID fiche</th>
                  <th>ID pèlerin</th>
                  <th>Photo</th>
                  <th>Nom</th>
                  <th>Prénoms</th>
                  <th>COVID</th>
                  <th>Grp. sanguin</th>
                  <th>Pouls</th>
                  <th>Tension</th>
                  <th>Poids</th>
                  <th>Passeport</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const pel = r.idPelerin ? pelerinsCache[r.idPelerin] : null;
                  const photo = pel?.photo || "";
                  return (
                    <tr
                      key={r.idInfo}
                      className={selectedId === r.idInfo ? "selected" : ""}
                      onClick={() => setSelectedId(r.idInfo)}
                      title="Cliquer pour sélectionner"
                    >
                      <td style={{ fontFamily: "ui-monospace, monospace" }}>{r.idInfo}</td>
                      <td style={{ fontFamily: "ui-monospace, monospace" }}>{r.idPelerin ?? "—"}</td>
                      <td style={{ width: 52 }}>
                        <img
                          alt={r.nom ? `Photo de ${r.nom}` : "Photo"}
                          src={photo || "https://via.placeholder.com/36x44?text=ID"}
                          style={{
                            width: 36,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 700 }}>{r.nom}</td>
                      <td>{r.prenoms}</td>
                      <td>{r.covid}</td>
                      <td>{r.groupeSanguin}</td>
                      <td>{r.pouls}</td>
                      <td>{r.tension}</td>
                      <td>{r.poids}</td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                        {r.passport}
                      </td>
                    </tr>
                  );
                })}
                {(!loading && data.length === 0) && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      Aucun enregistrement
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      Chargement…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Aside : aperçu rapide */}
          <div className="ip-aside">
            <div className="ip-preview">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  alt={selected ? `Photo de ${selected.nom}` : "Photo"}
                  src={selected?.photo || "https://via.placeholder.com/88x106?text=Photo"}
                  style={{
                    width: 88,
                    height: 106,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900 }}>
                    {selected ? `${selected.nom} ${selected.prenoms}` : "Aucune sélection"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {selected
                      ? `${selected.nomVoyage || "Voyage"} · ${selected.anneeVoyage || "—"}`
                      : "Sélectionne une ligne pour prévisualiser"}
                  </div>
                  {selected && (
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      <div><strong>📇 Passeport :</strong> {selected.passport}</div>
                      <div><strong>🩸 Groupe :</strong> {selected.groupeSanguin || "—"}</div>
                      <div><strong>💉 COVID :</strong> {selected.covid || "—"}</div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handlePrint} className="ip-btn print" style={{ width: "100%", marginTop: 12 }}>
                Imprimer cette fiche
              </button>
            </div>
          </div>
        </div>

        {/* Zone d'impression A4 — FICHE MÉDICALE */}
        <div className="print-area" ref={printRef}>
          {selected && (
            <div className="print-card" role="document" aria-label="Fiche médicale">
              <div className="wm">BMVT</div>

              <div className="ph-header">
                <div className="brand">
                  <img className="logo" alt="Logo" src={Logo} />
                  <div>
                    <div className="doc-title">FICHE MÉDICALE</div>
                    <div className="doc-sub">
                      {selected.nomVoyage || "—"} — {selected.anneeVoyage || "—"}
                    </div>
                  </div>
                </div>
                <div className="meta">
                  <div>{new Date().toLocaleDateString("fr-FR")}</div>
                  <div>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <div className="section">IDENTIFICATION</div>
              <div className="two-col">
                <div className="col">
                  <div className="row"><div className="label">ID fiche médicale :</div><div className="value">{selected.idInfo}</div></div>
                  <div className="row"><div className="label">ID Pèlerin :</div><div className="value">{selected.idPelerin ?? "—"}</div></div>
                  <div className="row"><div className="label">Nom :</div><div className="value">{selected.nom}</div></div>
                  <div className="row"><div className="label">Prénoms :</div><div className="value">{selected.prenoms}</div></div>
                  <div className="row"><div className="label">Date de naissance :</div><div className="value">{formatDate(selected.dateNaissance)}</div></div>
                  <div className="row"><div className="label">Lieu de naissance :</div><div className="value">{selected.lieuNaissance || "—"}</div></div>
                  <div className="row"><div className="label">Adresse :</div><div className="value">{selected.adresse || "—"}</div></div>
                  <div className="row"><div className="label">Contacts :</div><div className="value">{selected.contacts || "—"}</div></div>
                  <div className="row"><div className="label">Sexe :</div><div className="value">{selected.sexe || "—"}</div></div>
                  <div className="row"><div className="label">Passeport :</div><div className="value">{selected.passport}</div></div>
                </div>
                <div className="right-photo">
                  <img
                    alt={selected ? `Photo de ${selected.nom}` : "Photo"}
                    src={selected.photo || "https://via.placeholder.com/120x160?text=Photo"}
                    style={{ width: 120, height: 160, objectFit: "cover", border: "1px solid #e5e7eb", borderRadius: 4 }}
                  />
                </div>
              </div>

              <div className="section">CONSTANTES & EXAMENS</div>
              <div className="two-col">
                <div className="col">
                  <div className="row"><div className="label">Pouls :</div><div className="value">{selected.pouls || "—"}</div></div>
                  <div className="row"><div className="label">Tension :</div><div className="value">{selected.tension || "—"}</div></div>
                  <div className="row"><div className="label">Poids :</div><div className="value">{selected.poids || "—"}</div></div>
                  <div className="row"><div className="label">Groupe sanguin :</div><div className="value">{selected.groupeSanguin || "—"}</div></div>
                </div>
                <div className="col">
                  <div className="row"><div className="label">Carnet vaccins :</div><div className="value">{selected.carnetVaccins || "—"}</div></div>
                  <div className="row"><div className="label">Attestation COVID-19 :</div><div className="value">{selected.covid || "—"}</div></div>
                  <div className="row"><div className="label">Examen paraclinique :</div><div className="value">{selected.examenParaclinique || "—"}</div></div>
                </div>
              </div>

              <div className="section">PATHOLOGIES & VULNÉRABILITÉS</div>
              <div className="two-col">
                <div className="col">
                  <div className="row"><div className="label">Diabète :</div><div className="value">{selected.diabete || "—"}</div></div>
                  <div className="row"><div className="label">Maladie cardiaque :</div><div className="value">{selected.maladieCardiaque || "—"}</div></div>
                </div>
                <div className="col">
                  <div className="row"><div className="label">Vulnérabilité :</div><div className="value">{selected.vulnerabilite || "—"}</div></div>
                  <div className="row"><div className="label">Analyse psychiatrique :</div><div className="value">{selected.analysePsychiatrique || "—"}</div></div>
                </div>
              </div>

              <div className="section">ACCOMPAGNEMENTS & ANTÉCÉDENTS</div>
              <div className="two-col">
                <div className="col">
                  <div className="row"><div className="label">Accompagnements :</div><div className="value">{selected.accompagnements || "—"}</div></div>
                </div>
                <div className="col">
                  <div className="row"><div className="label">Antécédents :</div><div className="value">{selected.antecedents || "—"}</div></div>
                </div>
              </div>

              <div className="section">VOYAGE</div>
              <div>
                <div className="row"><div className="label">Nom du voyage :</div><div className="value">{selected.nomVoyage || "—"}</div></div>
                <div className="row"><div className="label">Année :</div><div className="value">{selected.anneeVoyage || "—"}</div></div>
                <div className="row"><div className="label">Offre :</div><div className="value">{selected.offre || "—"}</div></div>
                <div className="row"><div className="label">Hôtel :</div><div className="value">{selected.hotel || "—"}</div></div>
              </div>

              <div style={{ textAlign: "center", marginTop: 14, fontWeight: 900, color: "#9ca3af" }}>
                BMVT – Voyages & Tourismes
              </div>

              <div className="footer">
                <div>Agent enregistreur : <strong>{selected.employeEnregistreur || "—"}</strong></div>
                <div style={{ textAlign: "center" }}>
                  <img
                    className="signature"
                    alt="signature"
                    src="https://via.placeholder.com/160x44?text=Signature"
                  />
                </div>
                <div>Date création : {formatDate(selected.createdAt)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
