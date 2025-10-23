// src/pages/Paiement.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Search, FileClock, HandCoins } from "lucide-react";

export default function Paiement() {
  return (
    <div className="space-y-6 text-dyn">
      {/* En-tête (même thème que Médicale) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Paiement</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Recherche, historiques des paiements et suivi des versements des pèlerins.
        </p>
      </div>

      {/* Sections d’accès (3 tuiles) */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TileLink
          to="recherche"
          icon={Search}
          accent="blue"
          title="Recherche Informations Paiement"
          desc="Trouver un paiement par passeport, nom, référence, période, etc."
          cta="Ouvrir la recherche"
        />

        <TileLink
          to="historiques"
          icon={FileClock}
          accent="indigo"
          title="Historiques des Paiements"
          desc="Visualiser les règlements, statuts et reçus des transactions."
          cta="Voir l’historique"
        />

        <TileLink
          to="versements"
          icon={HandCoins}
          accent="sky"
          title="Historiques des Versements"
          desc="Suivre les acomptes, échéances et versements enregistrés."
          cta="Ouvrir les versements"
        />
      </section>

      {/* Sous-pages */}
      <Outlet />
    </div>
  );
}

/* ================== Sous-composant tuile (identique au style Médicale) ================== */
function TileLink({ to, icon: Icon, title, desc, cta, accent = "blue" }) {
  const tone = getTone(accent);

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition",
          "border-slate-200 hover:shadow-md",
          isActive ? "ring-2 ring-blue-200" : "ring-0",
        ].join(" ")
      }
    >
      {/* halos discrets */}
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
