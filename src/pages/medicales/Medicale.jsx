// src/pages/medicales/Medicale.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FilePlus2, ClipboardList, Printer, RefreshCw } from "lucide-react";

/* ========= Config API (même pattern que le reste de l’app) ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  // ✅ fallback : backend Render sécurisé en prod
  "https://hadjbackend.onrender.com";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/* ========= Mini util ========= */
function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ========= Page ========= */
export default function Medicale() {
  // états “infos rapides” tirées de l’API
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [totalMedicales, setTotalMedicales] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null); // ISO string

  // Récupère un aperçu global: total + dernière MAJ
  async function fetchOverview() {
    setLoading(true);
    setErr("");
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/medicales?limit=50`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const payload = await res.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const total = Number(payload?.total ?? items.length ?? 0);
      setTotalMedicales(total);

      // “dernière mise à jour” = max(created_at/updated_at) parmi le lot renvoyé
      const times = items
        .map(
          (r) =>
            r.updated_at ||
            r.created_at ||
            r.updatedAt ||
            r.createdAt
        )
        .filter(Boolean)
        .map((d) => Date.parse(d))
        .filter((n) => !Number.isNaN(n));
      if (times.length) {
        setLastUpdated(new Date(Math.max(...times)).toISOString());
      } else {
        setLastUpdated(null);
      }
    } catch (e) {
      setErr(e.message || "Échec du chargement");
      setTotalMedicales(0);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "—";
    try {
      const d = new Date(lastUpdated);
      return `${d.toLocaleDateString("fr-FR")} · ${d.toLocaleTimeString(
        "fr-FR",
        { hour: "2-digit", minute: "2-digit" }
      )}`;
    } catch {
      return "—";
    }
  }, [lastUpdated]);

  return (
    <div className="space-y-6 text-dyn">
      {/* ===== En-tête : ruban bleu (style app) ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-dyn-title font-extrabold text-slate-900">
                Dossier Médicale
              </h1>
              <p className="mt-1 text-dyn-sm text-slate-600">
                Saisir, consulter et imprimer les informations médicales des
                pèlerins.
              </p>
              {err && (
                <p className="mt-2 text-rose-600 text-dyn-sm">{err}</p>
              )}
            </div>

            {/* Statistiques rapides */}
            <div className="flex flex-wrap items-center gap-2">
              <QuickStat
                label="Dossiers"
                value={loading ? "…" : String(totalMedicales)}
              />
              <QuickStat
                label="Dernière mise à jour"
                value={loading ? "…" : lastUpdatedText}
              />
              <button
                type="button"
                onClick={fetchOverview}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-dyn-sm font-semibold text-slate-700 hover:bg-slate-50"
                title="Actualiser"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Sections d’accès (tuiles, thème app) ===== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Ajout */}
        <TileLink
          to="ajout"
          icon={FilePlus2}
          title="Saisir les informations médicales"
          desc="Examens, antécédents, traitements et remarques."
          cta="Ouvrir le formulaire"
          accent="blue"
        />

        {/* Liste */}
        <TileLink
          to="liste"
          icon={ClipboardList}
          title="Liste infos médicales"
          desc={`Rechercher, consulter et mettre à jour les dossiers (${
            loading ? "…" : totalMedicales
          }).`}
          cta="Voir la liste"
          accent="indigo"
        />

        {/* Impression */}
        <TileLink
          to="impression"
          icon={Printer}
          title="Impression fiche médicale"
          desc="Générer une fiche PDF prête à l’impression (BMVT)."
          cta="Préparer l’impression"
          accent="sky"
        />
      </section>

      {/* ===== Sous-pages ===== */}
      <Outlet />
    </div>
  );
}

/* ================== Tuile (relookée au thème BMVT) ================== */
function TileLink({ to, icon: Icon, title, desc, cta, accent = "blue" }) {
  const tone = getTone(accent);
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cls(
          "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition",
          "border-slate-200 hover:shadow-md",
          isActive && "ring-2 ring-blue-200"
        )
      }
    >
      {/* Halos discrets */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl"
        style={{ background: tone.halo }}
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full blur-2xl opacity-70"
        style={{ background: tone.haloSoft }}
      />

      <div className="flex items-start gap-3 relative">
        <div
          className="rounded-xl p-2 ring-1"
          style={{
            background: tone.iconBg,
            color: tone.iconFg,
            borderColor: tone.iconRing,
          }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-dyn-sm text-slate-600">{desc}</p>
        </div>
      </div>

      <div
        className="mt-4 inline-flex items-center gap-2 font-semibold transition group-hover:translate-x-0.5"
        style={{ color: tone.cta }}
      >
        {cta} <span aria-hidden>→</span>
      </div>
    </NavLink>
  );
}

/* ================== Petit composant “stat” ================== */
function QuickStat({ label, value }) {
  return (
    <div className="rounded-xl bg-blue-50/60 px-3 py-1.5 text-blue-800 ring-1 ring-blue-200">
      <span className="font-extrabold">{value}</span>{" "}
      <span className="text-dyn-sm">{label}</span>
    </div>
  );
}

/* ================== Palette (alignée au reste de l’app) ================== */
function getTone(accent) {
  switch (accent) {
    case "indigo":
      return {
        iconBg: "rgba(199,210,254,.35)",
        iconRing: "rgba(199,210,254,.9)",
        iconFg: "#4338ca",
        cta: "#4338ca",
        halo: "rgba(129,140,248,.25)",
        haloSoft: "rgba(129,140,248,.18)",
      };
    case "sky":
      return {
        iconBg: "rgba(186,230,253,.35)",
        iconRing: "rgba(186,230,253,.9)",
        iconFg: "#0369a1",
        cta: "#0369a1",
        halo: "rgba(125,211,252,.25)",
        haloSoft: "rgba(125,211,252,.18)",
      };
    case "blue":
    default:
      return {
        iconBg: "rgba(191,219,254,.35)",
        iconRing: "rgba(191,219,254,.9)",
        iconFg: "#1d4ed8",
        cta: "#1d4ed8",
        halo: "rgba(96,165,250,.25)",
        haloSoft: "rgba(96,165,250,.18)",
      };
  }
}
