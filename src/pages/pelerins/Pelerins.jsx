// src/pages/Pelerins.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { UserPlus, ListChecks } from "lucide-react";

export default function Pelerins() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,#ffbc54,#ff8f33)]">
        <div className="rounded-2xl border border-black/20 bg-black/20 backdrop-blur p-6 shadow-lg">
          <h1 className="text-2xl font-extrabold mb-2 text-white drop-shadow">
            Pèlerins
          </h1>
          <p className="text-slate-200/90">
            Gérer les pèlerins de A à Z : ajouter un nouveau dossier, consulter ou
            mettre à jour les informations existantes.
          </p>
        </div>
      </div>

      {/* Sections d’accès : Ajouter / Liste */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ajouter */}
        <NavLink
          to="ajouter"
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
              <UserPlus className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ajouter un pèlerin</h2>
              <p className="mt-1 text-sm text-slate-300">
                Créer un nouveau dossier (identité, passeport, contact, etc.).
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300 group-hover:translate-x-0.5 transition">
            Continuer
            <span aria-hidden>→</span>
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
              <ListChecks className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Liste des pèlerins</h2>
              <p className="mt-1 text-sm text-slate-300">
                Rechercher, filtrer et modifier les dossiers existants.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300 group-hover:translate-x-0.5 transition">
            Ouvrir
            <span aria-hidden>→</span>
          </div>
        </NavLink>
      </section>

      {/* Ici s’afficheront les sous-pages (ajouter / liste) si tu utilises des routes imbriquées */}
      <Outlet />
    </div>
  );
}
