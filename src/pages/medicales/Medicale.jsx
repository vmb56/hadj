// src/pages/medicales/Medicale.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FilePlus2, ClipboardList, Printer } from "lucide-react";

export default function Medicale() {
  return (
    <div className="space-y-6">
      {/* En-tête (identique à Pèlerins) */}
      <div className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,#ffbc54,#ff8f33)]">
        <div className="rounded-2xl border border-black/20 bg-black/20 backdrop-blur p-6 shadow-lg">
          <h1 className="text-2xl font-extrabold mb-2 text-white drop-shadow">
            Médicale
          </h1>
          <p className="text-slate-200/90">
            Saisir, consulter et imprimer les informations médicales des pèlerins.
          </p>
        </div>
      </div>

      {/* Sections d’accès : Ajout / Liste / Impression */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ajout */}
        <NavLink
          to="ajout"
          className={({ isActive }) =>
            [
              "group relative overflow-hidden rounded-2xl border border-black/20 bg-white/5 backdrop-blur p-5 text-white shadow-lg transition",
              "hover:shadow-2xl hover:bg-white/10",
              isActive ? "ring-2 ring-white/30" : "",
            ].join(" ")
          }
        >
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2 ring-1 ring-white/20">
              <FilePlus2 className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Saisir les informations médicales</h2>
              <p className="mt-1 text-sm text-slate-300">
                Examens, antécédents, traitements et remarques.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300 group-hover:translate-x-0.5 transition">
            Ouvrir le formulaire <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Liste */}
        <NavLink
          to="liste"
          className={({ isActive }) =>
            [
              "group relative overflow-hidden rounded-2xl border border-black/20 bg-white/5 backdrop-blur p-5 text-white shadow-lg transition",
              "hover:shadow-2xl hover:bg-white/10",
              isActive ? "ring-2 ring-white/30" : "",
            ].join(" ")
          }
        >
          <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 ring-1 ring-white/20">
              <ClipboardList className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Liste infos médicales</h2>
              <p className="mt-1 text-sm text-slate-300">
                Rechercher, consulter et mettre à jour les dossiers.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Voir la liste <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Impression */}
        <NavLink
          to="impression"
          className={({ isActive }) =>
            [
              "group relative overflow-hidden rounded-2xl border border-black/20 bg-white/5 backdrop-blur p-5 text-white shadow-lg transition",
              "hover:shadow-2xl hover:bg-white/10",
              isActive ? "ring-2 ring-white/30" : "",
            ].join(" ")
          }
        >
          <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 ring-1 ring-white/20">
              <Printer className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Impression fiche médicale</h2>
              <p className="mt-1 text-sm text-slate-300">
                Générer une fiche PDF prête à l’impression (BMVT).
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Préparer l’impression <span aria-hidden>→</span>
          </div>
        </NavLink>
      </section>

      {/* Sous-pages (ajout / liste / impression) */}
      <Outlet />
    </div>
  );
}
