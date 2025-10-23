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
    <div className="space-y-6 text-dyn">
      {/* Styles impression uniquement */}
      <style>{`
        @media print{
          body{background:white}
          body *{visibility:hidden}
          .print-area, .print-area *{visibility:visible}
          .print-area{position:absolute; inset:0; margin:0; padding:0}
          @page{size:A4; margin:10mm}
        }
      `}</style>

      {/* En-tête (thème Medicale) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">
          Impression — Photo de Passeport
        </h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Rechercher par numéro de passeport et imprimer le recto/verso.
        </p>
      </div>

      {/* Barre de recherche + actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="text-[13.5px] text-slate-700 font-semibold">
            Numéro de passeport
          </label>
          <input
            className="w-full md:w-72 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none ring-2 ring-transparent focus:ring-sky-200 font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex : 20AD24295"
          />
          <div className="md:ml-auto flex gap-2">
            <button
              className="rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
              onClick={handlePrint}
              type="button"
            >
              Imprimer
            </button>
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50"
              onClick={() => setQuery("")}
              type="button"
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="mt-2 text-[12.5px] text-slate-600">
          {record ? (
            <>
              Passeport :{" "}
              <span className="font-semibold text-slate-900">
                {record.passeport}
              </span>
            </>
          ) : (
            "Aucune photo trouvée"
          )}
        </div>
      </div>

      {/* Aperçu écran (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900 text-[18px]">
            Photos du passeport
          </div>
          <div className="text-slate-500 text-[12.5px]">
            {new Date().toLocaleDateString("fr-FR")} ·{" "}
            {new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {record ? (
          <div
            className={`mt-4 grid gap-4 ${
              record.photoPasseportRecto && record.photoPasseportVerso
                ? "md:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {record.photoPasseportRecto && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                <img
                  className="w-full rounded-lg border border-slate-200 object-contain bg-black aspect-[3/2]"
                  alt={`Passeport ${record.passeport} recto`}
                  src={record.photoPasseportRecto}
                />
                <div className="text-center text-slate-600 text-xs mt-1">
                  Recto
                </div>
              </div>
            )}
            {record.photoPasseportVerso && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                <img
                  className="w-full rounded-lg border border-slate-200 object-contain bg-black aspect-[3/2]"
                  alt={`Passeport ${record.passeport} verso`}
                  src={record.photoPasseportVerso}
                />
                <div className="text-center text-slate-600 text-xs mt-1">
                  Verso
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-slate-600">
            Saisis un numéro de passeport pour afficher la photo.
          </div>
        )}
      </div>

      {/* Zone imprimable (clair forcé) */}
      <div className="print-area">
        {record && (
          <div
            style={{
              padding: 16,
              margin: 16,
              background: "#fff",
              color: "#111",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                Photo du Passeport
              </div>
              <div
                style={{
                  fontSize: 12,
                  background: "#fde68a",
                  color: "#111",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {record.passeport}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns:
                  record.photoPasseportRecto && record.photoPasseportVerso
                    ? "1fr 1fr"
                    : "1fr",
              }}
            >
              {record.photoPasseportRecto && (
                <div>
                  <img
                    alt={`Passeport ${record.passeport} recto`}
                    src={record.photoPasseportRecto}
                    style={{
                      width: "100%",
                      aspectRatio: "3/2",
                      objectFit: "contain",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#000",
                    }}
                  />
                  <div
                    style={{
                      textAlign: "center",
                      color: "#475569",
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Recto
                  </div>
                </div>
              )}
              {record.photoPasseportVerso && (
                <div>
                  <img
                    alt={`Passeport ${record.passeport} verso`}
                    src={record.photoPasseportVerso}
                    style={{
                      width: "100%",
                      aspectRatio: "3/2",
                      objectFit: "contain",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#000",
                    }}
                  />
                  <div
                    style={{
                      textAlign: "center",
                      color: "#475569",
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Verso
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
