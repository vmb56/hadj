// src/pages/Impressions-pelerins.jsx
import React, { useMemo, useRef, useState } from "react";

/* ====================== Données de démo ====================== */
const SAMPLE_DATA = [
  {
    id: 51,
    passport: "20AD24295",
    nomVoyage: "HAJJ",
    photo: null, // url de la photo ou base64
    nom: "BAMBA",
    prenoms: "Yaya",
    dateNaissance: "1954-10-15",
    lieuNaissance: "odienne",
    adresse: "abobo",
    contacts: "777825514",
    sexe: "M",
    offre: "option 1",
    hotel: "Hôtel du pèlerin",
    anneeVoyage: 2025,
    nomPersonneContact: "Lamine",
    contactPersonne: "077782556",
    residencePersonne: "abobo",
    employeEnregistreur: "ISMOSOG",
  },
  // Ajoute tes enregistrements réels ici…
];

/* ====================== Helpers ====================== */
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("fr-FR");
}

/* ====================== Composant principal ====================== */
export default function ImpressionsPelerins() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(SAMPLE_DATA);
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => data.find((x) => x.id === selectedId) || null,
    [data, selectedId]
  );
  const printRef = useRef(null);

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) {
      setData(SAMPLE_DATA);
      setSelectedId(null);
      return;
    }
    const filtered = SAMPLE_DATA.filter((r) =>
      r.passport.toLowerCase().includes(q)
    );
    setData(filtered);
    setSelectedId(filtered.length === 1 ? filtered[0].id : null);
  }

  function handleClear() {
    setQuery("");
    setData(SAMPLE_DATA);
    setSelectedId(null);
  }

  function handlePrint() {
    if (!selected) {
      alert("Sélectionne un enregistrement avant d’imprimer.");
      return;
    }
    window.print();
  }

  return (
    <div className="ip-page">
      {/* ====== Styles portés par le composant (modernes + thème) ====== */}
      <style>{`
        :root {
          --bg: #0f172a;           /* slate-900 */
          --card: #111827;         /* gray-900 */
          --muted: #94a3b8;        /* slate-400 */
          --text: #e5e7eb;         /* gray-200 */
          --accent: #22c55e;       /* green-500 */
          --accent-2: #60a5fa;     /* blue-400 */
          --warn: #f59e0b;         /* amber-500 */
          --chip: #1f2937;         /* gray-800 */
          --border: #1f2937;       /* gray-800 */
          --row: rgba(255,255,255,0.03);
          --row-alt: rgba(255,255,255,0.06);
          --shadow: 0 10px 30px rgba(0,0,0,.35);
        }

        .ip-page {
          min-height: 100dvh;
          background: radial-gradient(1200px 700px at 10% -10%, #172554 0%, transparent 70%),
                      radial-gradient(1000px 600px at 110% 10%, #064e3b 0%, transparent 60%),
                      var(--bg);
          padding: 24px;
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial;
        }

        .ip-shell {
          max-width: 1280px;
          margin: 0 auto;
        }

        .ip-header {
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          margin-bottom: 18px;
        }
        .ip-title {
          display:flex; align-items:center; gap:12px;
        }
        .ip-badge {
          background: linear-gradient(135deg,#0ea5e9 0%, #22c55e 100%);
          color: white; font-weight: 800; letter-spacing: .5px;
          padding: 8px 12px; border-radius: 999px; font-size: 12px;
          box-shadow: var(--shadow);
        }

        .ip-card {
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
        }

        .ip-controls {
          padding: 16px;
          display:flex; gap:10px; align-items:center; flex-wrap: wrap;
        }
        .ip-input {
          background:#0b1220;
          border:1px solid #1f2937;
          color: var(--text);
          padding:10px 12px;
          border-radius:10px;
          outline:none;
          width: 320px;
        }
        .ip-btn {
          border:1px solid #1f2937;
          color:var(--text);
          padding:10px 14px;
          border-radius:10px;
          background:#0b1220;
          cursor:pointer; font-weight:600;
        }
        .ip-btn:hover { border-color:#334155; }
        .ip-btn.primary { background: linear-gradient(135deg, #22c55e, #16a34a); border-color: transparent; }
        .ip-btn.primary:hover { filter: brightness(1.05); }
        .ip-btn.print { background: linear-gradient(135deg, #60a5fa, #2563eb); border-color: transparent; }
        .ip-btn.print:hover { filter: brightness(1.05); }
        .ip-btn.ghost { background: transparent; }

        .ip-layout {
          display:grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .ip-layout { grid-template-columns: 1fr; }
        }

        /* ===== Table ===== */
        .ip-table { width:100%; border-collapse: collapse; overflow:hidden; border-radius:16px; }
        .ip-table thead th {
          text-align:left; padding:12px 12px; font-size:12px; letter-spacing:.4px; color:var(--muted);
          background:#0b1220; border-bottom:1px solid var(--border);
        }
        .ip-table tbody td {
          padding:12px; font-size:14px; border-bottom:1px solid #11182766;
        }
        .ip-table tbody tr {
          background: var(--row);
        }
        .ip-table tbody tr:nth-child(even) { background: var(--row-alt); }
        .ip-table tbody tr:hover {
          background: linear-gradient(90deg, rgba(34,197,94,.25), rgba(96,165,250,.25));
          cursor:pointer;
        }
        .ip-table tr.selected {
          background: linear-gradient(90deg, #fb923c, #f59e0b) !important; color:#111827;
        }
        .chip { display:inline-flex; align-items:center; gap:6px; background: var(--chip); padding:6px 10px; border-radius:999px; font-size:12px; }

        /* ===== Aperçu ===== */
        .ip-aside { padding: 16px; }
        .ip-preview {
          background: #0b1220;
          border:1px solid #1f2937;
          border-radius: 14px;
          padding: 14px;
        }

        /* ===== Impression ===== */
        .print-area { margin-top: 18px; }
        .print-card {
          width: 210mm;
          background: white;
          color: #111;
          padding: 18mm;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          position: relative;
          box-sizing: border-box;
        }
        .wm {
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(-8deg);
          font-weight:900; font-size:120px; color: rgba(245,158,11,0.08); letter-spacing: 2px; user-select:none; pointer-events:none;
        }
        .ph-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
        .brand { display:flex; align-items:center; gap: 12px; }
        .brand .logo { width: 72px; height: 72px; object-fit: contain; }
        .doc-title { font-size: 18px; font-weight: 900; }
        .doc-sub { color:#374151; font-size: 13px; margin-top: 2px; }
        .meta { text-align: right; font-size: 12px; color:#6b7280; }
        .section { background:#fbbf24; font-weight: 800; padding: 6px 10px; margin: 10px 0; color:#111; }
        .row { display:flex; gap:8px; margin:6px 0; }
        .label { width: 220px; font-weight: 700; color:#374151; }
        .value { flex:1; }

        .two-col { display:flex; gap: 20px; }
        .col { flex: 1; }
        .right-photo { width: 120px; text-align: center; }

        .footer {
          margin-top: 16px; padding-top: 10px;
          border-top: 1px dashed #d1d5db;
          display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px;
        }
        .signature { height: 56px; display:block; }

        /* N'imprime que la carte */
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; inset: 0; margin: 0; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="ip-shell">
        <div className="ip-header">
          <div className="ip-title">
            <span className="ip-badge">BMVT</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.3 }}>
                Impressions – Fiche Pèlerin
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Recherche par numéro de passeport · Sélection · Impression A4
              </div>
            </div>
          </div>

          <div className="chip" title="Total enregistrements">
            <span>📄</span>
            <strong>{SAMPLE_DATA.length}</strong> au total
          </div>
        </div>

        {/* Barre de recherche & actions */}
        <div className="ip-card">
          <form className="ip-controls" onSubmit={handleSearch}>
            <input
              className="ip-input"
              placeholder="Rechercher par N° de passeport (ex : 20AD24295)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="ip-btn primary">Rechercher</button>
            <button type="button" className="ip-btn ghost" onClick={handleClear}>
              Effacer
            </button>
            <button type="button" className="ip-btn print" onClick={handlePrint}>
              Imprimer la fiche
            </button>
            <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}>
              {selected
                ? `Sélectionné : ${selected.nom} ${selected.prenoms}`
                : `${data.length} résultat(s)`}
            </div>
          </form>
        </div>

        {/* Layout principal */}
        <div className="ip-layout" style={{ marginTop: 16 }}>
          {/* Tableau */}
          <div className="ip-card" style={{ padding: 12 }}>
            <table className="ip-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom voyage</th>
                  <th>Photo</th>
                  <th>Nom</th>
                  <th>Prénoms</th>
                  <th>Date naissance</th>
                  <th>Passeport</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className={selectedId === r.id ? "selected" : ""}
                    onClick={() => setSelectedId(r.id)}
                    title="Cliquer pour sélectionner"
                  >
                    <td>{r.id}</td>
                    <td>
                      <span className="chip">
                        ✈️ <strong>{r.nomVoyage}</strong>
                      </span>
                    </td>
                    <td style={{ width: 52 }}>
                      <img
                        alt=""
                        src={r.photo || "https://via.placeholder.com/36x44?text=ID"}
                        style={{
                          width: 36,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #1f2937",
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.nom}</td>
                    <td>{r.prenoms}</td>
                    <td>{formatDate(r.dateNaissance)}</td>
                    <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {r.passport}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      Aucun enregistrement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Aside : aperçu */}
          <div className="ip-aside">
            <div className="ip-preview">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  alt="photo"
                  src={
                    selected?.photo || "https://via.placeholder.com/88x106?text=Photo"
                  }
                  style={{
                    width: 88,
                    height: 106,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #1f2937",
                  }}
                />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    {selected ? `${selected.nom} ${selected.prenoms}` : "Aucune sélection"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {selected ? `${selected.nomVoyage} · ${selected.anneeVoyage}` : "Sélectionne une ligne pour prévisualiser"}
                  </div>
                  {selected && (
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      <div><strong>📇 Passeport :</strong> {selected.passport}</div>
                      <div><strong>📞 Contact :</strong> {selected.contacts}</div>
                      <div><strong>📍 Adresse :</strong> {selected.adresse}</div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="ip-btn print"
                style={{ width: "100%", marginTop: 12 }}
              >
                Imprimer cette fiche
              </button>
            </div>
          </div>
        </div>

        {/* Zone d'impression A4 */}
        <div className="print-area" ref={printRef}>
          {selected && (
            <div className="print-card" role="document" aria-label="Fiche d'inscription">
              <div className="wm">BMVT</div>

              <div className="ph-header">
                <div className="brand">
                  <img
                    className="logo"
                    alt="Logo"
                    src="https://via.placeholder.com/120x60?text=LOGO" /* Remplacer par ton logo */
                  />
                  <div>
                    <div className="doc-title">FICHE D'INSCRIPTION</div>
                    <div className="doc-sub">{selected.nomVoyage}</div>
                  </div>
                </div>
                <div className="meta">
                  <div>{new Date().toLocaleDateString("fr-FR")}</div>
                  <div>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <div className="section">INFORMATIONS PERSONNELLES DU PÈLERIN</div>
              <div className="two-col">
                <div className="col">
                  <div className="row"><div className="label">Identifiant de Pèlerin :</div><div className="value">{selected.id}</div></div>
                  <div className="row"><div className="label">Nom du Pèlerin :</div><div className="value">{selected.nom}</div></div>
                  <div className="row"><div className="label">Prénoms du Pèlerin :</div><div className="value">{selected.prenoms}</div></div>
                  <div className="row"><div className="label">Date de naissance :</div><div className="value">{formatDate(selected.dateNaissance)}</div></div>
                  <div className="row"><div className="label">Lieu de naissance :</div><div className="value">{selected.lieuNaissance}</div></div>
                  <div className="row"><div className="label">Adresse :</div><div className="value">{selected.adresse}</div></div>
                  <div className="row"><div className="label">Contacts :</div><div className="value">{selected.contacts}</div></div>
                  <div className="row"><div className="label">Sexe :</div><div className="value">{selected.sexe}</div></div>
                </div>
                <div className="right-photo">
                  <img
                    alt="Photo pèlerin"
                    src={selected.photo || "https://via.placeholder.com/120x160?text=Photo"}
                    style={{ width: 120, height: 160, objectFit: "cover", border: "1px solid #e5e7eb", borderRadius: 4 }}
                  />
                </div>
              </div>

              <div className="section">INFORMATIONS CONCERNANT LE VOYAGE</div>
              <div>
                <div className="row"><div className="label">Numéro de passeport :</div><div className="value">{selected.passport}</div></div>
                <div className="row"><div className="label">Offre choisie :</div><div className="value">{selected.offre}</div></div>
                <div className="row"><div className="label">Hôtel du pèlerin :</div><div className="value">{selected.hotel}</div></div>
                <div className="row"><div className="label">Année de voyage :</div><div className="value">{selected.anneeVoyage}</div></div>
                <div className="row"><div className="label">Nom du voyage :</div><div className="value">{selected.nomVoyage}</div></div>
              </div>

              <div className="section">PERSONNE À CONTACTER EN CAS D’URGENCE</div>
              <div>
                <div className="row"><div className="label">Nom :</div><div className="value">{selected.nomPersonneContact}</div></div>
                <div className="row"><div className="label">Contact :</div><div className="value">{selected.contactPersonne}</div></div>
                <div className="row"><div className="label">Résidence :</div><div className="value">{selected.residencePersonne}</div></div>
              </div>

              <div style={{ textAlign: "center", marginTop: 14, fontWeight: 900, color: "#9ca3af" }}>
                BMVT – Voyages & Tourismes
              </div>

              <div className="footer">
                <div>Nom_Employeur_Enregistreur : <strong>{selected.employeEnregistreur}</strong></div>
                <div style={{ textAlign: "center" }}>
                  <img
                    className="signature"
                    alt="signature"
                    src="https://via.placeholder.com/160x44?text=Signature" /* Remplacer par ta signature */
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
