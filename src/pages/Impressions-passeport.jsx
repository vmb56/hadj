// src/pages/Impression-photo-passeport.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ========= Config API — backend Render BMVT ========= */
const API_BASE = "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ========= Helpers ========= */
function mediaURL(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = API_BASE.replace(/\/+$/, "");
  const rel  = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}
function isPdfPath(p = "") {
  return typeof p === "string" && /\.pdf(\?|#|$)/i.test(p);
}
function bust(url) {
  if (!url) return url;
  const u = new URL(url, window.location.origin);
  u.searchParams.set("_t", Date.now()); // anti cache
  return u.toString();
}

/** Normalise une réponse backend (souple sur les noms de champs) */
function normalizePayload(x) {
  if (!x) return null;

  // Numéro passeport
  const pass =
    x.num_passeport || x.numPasseport || x.passeport || x.passport || "";

  // On accepte plusieurs conventions pour recto/verso (url ou path)
  // Recto
  const rectoRaw =
    x.photo_passeport_recto_url ||
    x.photo_passeport_recto_path ||
    x.photoPasseportRectoUrl ||
    x.photoPasseportRecto ||
    x.photo_passeport_path || // fallback: certains back n’ont qu’une seule image
    x.photoPasseport ||
    "";

  // Verso
  const versoRaw =
    x.photo_passeport_verso_url ||
    x.photo_passeport_verso_path ||
    x.photoPasseportVersoUrl ||
    x.photoPasseportVerso ||
    "";

  const recto = rectoRaw ? mediaURL(rectoRaw) : "";
  const verso = versoRaw ? mediaURL(versoRaw) : "";

  return {
    passeport: pass,
    recto: recto ? bust(recto) : "",
    verso: verso ? bust(verso) : "",
  };
}

/* ========= Composant ========= */
export default function ImpressionPhotoPasseport() {
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState(null);     // {passeport, recto, verso}
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const debounceRef = useRef(null);

  // Nettoyage du champ (MAJUSCULES, alphanum, max 9)
  function onChangeQuery(e) {
    const cleaned = e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 9);
    setQuery(cleaned);
  }

  // --------- Appel API par passeport ----------
  // 1) Essaye: /api/pelerins/passport-photos?passport=XXX
  // 2) Si 404/aucun, retombe sur: /api/pelerins/by-passport?passport=XXX
  async function fetchByPassport(p) {
    if (!p) { setRecord(null); setErr(""); return; }
    setLoading(true);
    setErr("");

    const token = getToken();
    const hdrs = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    async function call(url) {
      const res = await fetch(url, {
        headers: hdrs,
        // backend Render : pas de cookies
        credentials: "omit",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    }

    try {
      // tentative #1 : endpoint direct des photos
      const url1 = new URL(`${API_BASE.replace(/\/+$/, "")}/api/pelerins/passport-photos`);
      url1.searchParams.set("passport", p);
      let j = await call(url1.toString());

      let item = Array.isArray(j) ? j[0] : j;
      if (!item || typeof item !== "object") {
        // tentative #2 : endpoint générique by-passport (retourne le pelerin complet)
        const url2 = new URL(`${API_BASE.replace(/\/+$/, "")}/api/pelerins/by-passport`);
        url2.searchParams.set("passport", p);
        j = await call(url2.toString());
        item = Array.isArray(j) ? j[0] : j;
      }

      const norm = normalizePayload(item);
      setRecord(norm && (norm.recto || norm.verso) ? norm : null);
      if (!(norm && (norm.recto || norm.verso))) {
        setErr("Aucune photo recto/verso trouvée pour ce passeport.");
      }
    } catch (e) {
      setErr(e.message || "Échec de la récupération");
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  // Debounce sur la saisie
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 5) { setRecord(null); setErr(""); return; }
    debounceRef.current = setTimeout(() => fetchByPassport(query), 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Recherche manuelle (bouton)
  function handleSearchClick() {
    if (!query || query.length < 5) {
      setErr("Saisis au moins 5 caractères (A–Z, 0–9).");
      setRecord(null);
      return;
    }
    fetchByPassport(query);
  }

  // Texte d’état
  const stateNode = useMemo(() => {
    if (loading) return <span className="text-slate-500">Chargement…</span>;
    if (err) return <span className="text-rose-600">{err}</span>;
    if (!record) return <span className="text-slate-600">Aucune photo trouvée</span>;
    return (
      <>
        Passeport :{" "}
        <span className="font-semibold text-slate-900">{record.passeport || query}</span>
      </>
    );
  }, [loading, err, record, query]);

  function handlePrint() {
    if (!record || (!record.recto && !record.verso)) {
      alert("Aucune photo trouvée pentru ce numéro de passeport.");
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

      {/* En-tête */}
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
            onChange={onChangeQuery}
            placeholder="Ex : 20AD24295"
            inputMode="text"
            minLength={5}
            maxLength={9}
            pattern="^[A-Z0-9]{5,9}$"
          />
          <div className="md:ml-auto flex gap-2">
            <button
              className="rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
              onClick={handleSearchClick}
              type="button"
            >
              Rechercher
            </button>
            <button
              className="rounded-xl bg-sky-600 text-white px-3 py-2 text-[13.5px] hover:brightness-110"
              onClick={handlePrint}
              type="button"
            >
              Imprimer
            </button>
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] hover:bg-slate-50"
              onClick={() => { setQuery(""); setRecord(null); setErr(""); }}
              type="button"
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="mt-2 text-[12.5px]">{stateNode}</div>
      </div>

      {/* Aperçu écran */}
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

        {record && (record.recto || record.verso) ? (
          <div
            className={`mt-4 grid gap-4 ${
              record.recto && record.verso ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {record.recto && (
              <PreviewCard src={record.recto} label="Recto" />
            )}
            {record.verso && (
              <PreviewCard src={record.verso} label="Verso" />
            )}
          </div>
        ) : (
          <div className="mt-4 text-slate-600">
            Saisis un numéro de passeport pour afficher la photo.
          </div>
        )}
      </div>

      {/* Zone imprimable */}
      <div className="print-area">
        {record && (record.recto || record.verso) && (
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
                {record.passeport || query}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns:
                  record.recto && record.verso ? "1fr 1fr" : "1fr",
              }}
            >
              {record.recto && (
                <PrintableImageOrPdf
                  alt={`Passeport ${record.passeport || query} recto`}
                  src={record.recto}
                  label="Recto"
                />
              )}
              {record.verso && (
                <PrintableImageOrPdf
                  alt={`Passeport ${record.passeport || query} verso`}
                  src={record.verso}
                  label="Verso"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======= sous-composants ======= */
function PreviewCard({ src, label }) {
  const pdf = isPdfPath(src);
  const downloadName = `${label}.pdf`;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
      {pdf ? (
        <PdfEmbed src={src} label={label} />
      ) : (
        <img
          className="w-full rounded-lg border border-slate-200 object-contain bg-black aspect-[3/2]"
          alt={label}
          src={src}
        />
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="text-slate-600 text-xs">{label}</div>
        <a
          href={src}
          download={pdf ? downloadName : undefined}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-sky-700 hover:underline"
          title="Ouvrir / Télécharger"
        >
          Ouvrir / Télécharger
        </a>
      </div>
    </div>
  );
}

function PdfEmbed({ src, label }) {
  // object + iframe fallback pour contourner X-Frame-Options
  return (
    <div className="aspect-[3/2] w-full rounded-lg border border-slate-200 overflow-hidden bg-white">
      <object data={src} type="application/pdf" className="w-full h-full">
        <iframe title={label} src={src} className="w-full h-full" />
        <div className="w-full h-full grid place-items-center p-3 text-center text-[12px] text-slate-600">
          Impossible d’afficher le PDF ici.{" "}
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 font-semibold underline ml-1"
          >
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </object>
    </div>
  );
}

function PrintableImageOrPdf({ src, alt, label }) {
  const pdf = isPdfPath(src);
  return (
    <div>
      {pdf ? (
        <object
          data={src}
          type="application/pdf"
          style={{
            width: "100%",
            aspectRatio: "3/2",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          <iframe
            title={alt}
            src={src}
            style={{
              width: "100%",
              height: "100%",
              border: "0",
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
            PDF — {label} (ouvrir dans un onglet si non visible)
          </div>
        </object>
      ) : (
        <img
          alt={alt}
          src={src}
          style={{
            width: "100%",
            aspectRatio: "3/2",
            objectFit: "contain",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#000",
          }}
        />
      )}
      <div
        style={{
          textAlign: "center",
          color: "#475569",
          fontSize: 11,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
