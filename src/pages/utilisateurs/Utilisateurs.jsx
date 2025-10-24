// src/pages/Utilisateurs.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Users, Clock, UserPlus } from "lucide-react";

export default function Utilisateurs() {
  return (
    <div className="space-y-6 text-dyn">
      {/* En-tête (clair, cohérent Medicale.jsx) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">
          Utilisateurs
        </h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Gérer les comptes, inscriptions et l’historique des connexions.
        </p>
      </div>

      {/* Tuiles de navigation */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TileLink
          to="liste"
          icon={Users}
          accent="blue"
          title="Liste utilisateurs"
          desc="Voir, rechercher et gérer les comptes existants."
          cta="Ouvrir la liste"
        />
        {/* <TileLink
          to="historique"
          icon={Clock}
          accent="indigo"
          title="Historique de connexion"
          desc="Suivre les connexions, dates, IP et statuts."
          cta="Consulter l’historique"
        /> */}
        <TileLink
          to="inscription"
          icon={UserPlus}
          accent="emerald"
          title="Inscription utilisateur"
          desc="Créer un nouveau compte et définir ses rôles."
          cta="Créer un compte"
        />
      </section>

      {/* Sous-pages */}
      <Outlet />
    </div>
  );
}

/* ================== Sous-composant tuile (thème Medicale) ================== */
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
    case "emerald":
      return {
        iconBg: "rgba(167,243,208,.35)",
        iconRing: "rgba(167,243,208,.9)",
        iconFg: "#047857",
        cta: "#047857",
        halo: "rgba(110,231,183,.25)",
        haloSoft: "rgba(110,231,183,.18)",
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
