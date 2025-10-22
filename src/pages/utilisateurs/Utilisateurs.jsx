// src/pages/Utilisateurs.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Users, Clock, UserPlus } from "lucide-react";

export default function Utilisateurs() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,#ffbc54,#ff8f33)]">
        <div className="rounded-2xl border border-black/20 bg-black/20 backdrop-blur p-6 shadow-lg">
          <h1 className="text-2xl font-extrabold mb-2 text-white drop-shadow">
            Utilisateurs
          </h1>
          <p className="text-slate-200/90">
            Gérer les comptes, inscriptions et l’historique des connexions.
          </p>
        </div>
      </div>

      {/* Tuiles de navigation */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Liste des utilisateurs */}
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
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2 ring-1 ring-white/20">
              <Users className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Liste utilisateurs</h2>
              <p className="mt-1 text-sm text-slate-300">
                Voir, rechercher et gérer les comptes existants.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300 group-hover:translate-x-0.5 transition">
            Ouvrir la liste <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Historique de connexion */}
        <NavLink
          to="historique"
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
              <Clock className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Historique de connexion</h2>
              <p className="mt-1 text-sm text-slate-300">
                Suivre les connexions, dates, IP et statuts.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Consulter l’historique <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Inscription utilisateur */}
        <NavLink
          to="inscription"
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
            <div className="rounded-xl bg-emerald-500/20 p-2 ring-1 ring-white/20">
              <UserPlus className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Inscription utilisateur</h2>
              <p className="mt-1 text-sm text-slate-300">
                Créer un nouveau compte et définir ses rôles.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300 group-hover:translate-x-0.5 transition">
            Créer un compte <span aria-hidden>→</span>
          </div>
        </NavLink>
      </section>

      {/* Sous-pages */}
      <Outlet />
    </div>
  );
}
