// src/pages/Paiement.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Search, FileClock, HandCoins } from "lucide-react";

export default function Paiement() {
  return (
    <div className="space-y-6">
      {/* En-tête (même style que Médicale) */}
      <div className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,#ffbc54,#ff8f33)]">
        <div className="rounded-2xl border border-black/20 bg-black/20 backdrop-blur p-6 shadow-lg">
          <h1 className="text-2xl font-extrabold mb-2 text-white drop-shadow">
            Paiement
          </h1>
          <p className="text-slate-200/90">
            Recherche, historiques des paiements et suivi des versements des pèlerins.
          </p>
        </div>
      </div>

      {/* Sections d’accès (3 cartes) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recherche Informations Paiement */}
        <NavLink
          to="recherche"
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
              <Search className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Recherche Informations Paiement</h2>
              <p className="mt-1 text-sm text-slate-300">
                Trouver un paiement par passeport, nom, référence, période, etc.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300 group-hover:translate-x-0.5 transition">
            Ouvrir la recherche <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Historiques Paiement */}
        <NavLink
          to="historiques"
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
              <FileClock className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Historiques des Paiements</h2>
              <p className="mt-1 text-sm text-slate-300">
                Visualiser les règlements, statuts et reçus des transactions.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Voir l’historique <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Historiques des Versements */}
        <NavLink
          to="versements"
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
              <HandCoins className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Historiques des Versements</h2>
              <p className="mt-1 text-sm text-slate-300">
                Suivre les acomptes, échéances et versements enregistrés.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Ouvrir les versements <span aria-hidden>→</span>
          </div>
        </NavLink>
      </section>

      {/* Sous-pages Paiement */}
      <Outlet />
    </div>
  );
}
