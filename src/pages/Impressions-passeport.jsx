// src/pages/Impression-photo-passeport.jsx
import React, { useMemo, useState } from "react";

/** Données d'exemple — remplace par tes vraies données (URL ou base64) */
const SAMPLE_DATA = [
  {
    passeport: "20AD24295",
    photoPasseportRecto:
      "https://via.placeholder.com/1000x700.png?text=PASSEPORT+RECTO",
    photoPasseportVerso:
      "https://via.placeholder.com/1000x700.png?text=PASSEPORT+VERSO",
  },
  {
    passeport: "A12345678",
    photoPasseportRecto:
      "https://via.placeholder.com/1000x700.png?text=RECTO",
    photoPasseportVerso: null,
  },
];

export default function ImpressionPhotoPasseport() {
  const [query, setQuery] = useState("20AD24295");

  // On récupère un seul enregistrement correspondant au n° tapé
  const record = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (
      SAMPLE_DATA.find((p) => p.passeport.toLowerCase().includes(q)) || null
    );
  }, [query]);

  function handlePrint() {
    if (!record) {
      alert("Aucune photo trouvée pour ce numéro de passeport.");
      return;
    }
    window.print();
  }

  return (
    <div className="ppage">
      <style>{`
        :root{
          --bg:#06353a;
          --panel:#0b3c41;
          --text:#e5e7eb;
          --muted:#cbd5e1;
          --border:#0f4b51;
          --shadow:0 12px 30px rgba(0,0,0,.35);
        }
        .ppage{
          min-height:100dvh;
          background: var(--bg);
          color: var(--text);
          padding: 18px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .wrap{ max-width: 1100px; margin: 0 auto; }

        /* Barre de recherche compacte */
        .bar{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
        label{ font-weight:800; letter-spacing:.3px; }
        .input{
          background:#072e31; border:1px solid var(--border);
          color:var(--text); padding:10px 12px; border-radius:10px; width:320px;
          outline:none;
        }
        .btn{
          padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:800; border:none;
          background:linear-gradient(135deg,#60a5fa,#2563eb); color:#fff;
        }
        .btn.secondary{ background:transparent; border:1px solid var(--border); color:var(--text); }

        /* Carte d'aperçu (écran) */
        .card{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow);
          padding:14px;
        }
        .head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .title{ font-weight:900; font-size:18px; }
        .meta{ color:var(--muted); font-size:12px; }

        /* Zone photo (écran) */
        .photos{
          display:grid; gap:12px;
        }
        .two{ grid-template-columns:1fr 1fr; }
        @media (max-width:900px){ .two{ grid-template-columns:1fr; } }

        .preview{
          background:#041f21; border:1px solid #1f4b50; border-radius:12px; padding:8px;
        }
        .img{
          width:100%; aspect-ratio: 3/2; object-fit: contain; background:#000; border-radius:8px;
        }
        .caption{ text-align:center; color:var(--muted); font-size:12px; margin-top:6px; }

        /* Impression : on n'imprime QUE .print-area */
        @media print{
          body *{ visibility:hidden; }
          .print-area, .print-area *{ visibility:visible; }
          .print-area{ position:absolute; inset:0; margin:0; padding:0 10mm; }
          @page { size: A4; margin: 10mm; }
        }

        /* Mise en page imprimée */
        .print-card{
          background:#fff; color:#111; border:1px solid #e5e7eb; border-radius:6px; padding:10px;
        }
        .print-head{
          display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;
        }
        .print-title{ font-weight:900; font-size:16px; }
        .tag{ font-size:12px; background:#fde68a; color:#111; font-weight:800; padding:2px 8px; border-radius:999px; }
        .grid-print{
          display:grid; gap:10px;
        }
        .grid-two{ grid-template-columns:1fr 1fr; }
        .ph{
          width:100%; aspect-ratio: 3/2; object-fit: contain; border:1px solid #d1d5db; border-radius:6px; background:#000;
        }
        .legend{ text-align:center; color:#475569; font-size:11px; margin-top:4px; }
      `}</style>

      <div className="wrap">
        {/* barre simple */}
        <div className="bar">
          <label>Numéro de passeport :</label>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex : 20AD24295"
          />
          <button className="btn" onClick={handlePrint}>IMPRIMER</button>
          <button className="btn secondary" onClick={() => setQuery("")}>Effacer</button>
          <span style={{ marginLeft:"auto", opacity:.85 }}>
            {record ? `Passeport : ${record.passeport}` : "Aucune photo trouvée"}
          </span>
        </div>

        {/* Aperçu ÉCRAN : uniquement les photos */}
        <div className="card">
          <div className="head">
            <div className="title">Photo du Passeport</div>
            <div className="meta">
              {new Date().toLocaleDateString("fr-FR")} · {new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
            </div>
          </div>

          {record ? (
            <div className={`photos ${record.photoPasseportRecto && record.photoPasseportVerso ? "two" : ""}`}>
              {record.photoPasseportRecto && (
                <div className="preview">
                  <img className="img" alt={`Passeport ${record.passeport} recto`} src={record.photoPasseportRecto} />
                  <div className="caption">Recto</div>
                </div>
              )}
              {record.photoPasseportVerso && (
                <div className="preview">
                  <img className="img" alt={`Passeport ${record.passeport} verso`} src={record.photoPasseportVerso} />
                  <div className="caption">Verso</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ opacity:.8 }}>Saisis un numéro de passeport pour afficher la photo.</div>
          )}
        </div>

        {/* Zone IMPRIMABLE : uniquement les photos */}
        <div className="print-area" aria-hidden="true">
          {record && (
            <div className="print-card">
              <div className="print-head">
                <div className="print-title">Photo du Passeport</div>
                <div className="tag">{record.passeport}</div>
              </div>

              <div className={`grid-print ${record.photoPasseportRecto && record.photoPasseportVerso ? "grid-two" : ""}`}>
                {record.photoPasseportRecto && (
                  <div>
                    <img className="ph" alt={`Passeport ${record.passeport} recto`} src={record.photoPasseportRecto} />
                    <div className="legend">Recto</div>
                  </div>
                )}
                {record.photoPasseportVerso && (
                  <div>
                    <img className="ph" alt={`Passeport ${record.passeport} verso`} src={record.photoPasseportVerso} />
                    <div className="legend">Verso</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
