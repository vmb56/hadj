// src/pages/Pelerins.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { UserPlus, ListChecks } from "lucide-react";

/**
 * Cette page utilise les classes dynamiques définies dans MainLayout :
 * - .text-dyn, .text-dyn-sm, .text-dyn-title, .icon-dyn-sm
 * Et reprend la charte blue & white (cartes blanches, anneaux bleus, hover doux).
 */
export default function Pelerins() {
  return (
    <div className="space-y-6 text-dyn">
      {/* ===== En-tête (white card + accent bleu) ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Accent gradient en haut */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="p-6">
          <h1 className="text-dyn-title text-slate-900">Pèlerins</h1>
          <p className="mt-1 text-slate-600 text-dyn-sm">
            Gérer les pèlerins de A à Z : créer un dossier, consulter et mettre à jour les informations.
          </p>
        </div>
      </div>

      {/* ===== Tuiles d’accès ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ajouter */}
        <NavLink
          to="ajouter"
          className={({ isActive }) =>
            [
              "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition",
              "border-slate-200 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/20",
              isActive ? "ring-2 ring-blue-300 bg-blue-50/40" : "",
            ].join(" ")
          }
        >
          {/* halo décoratif */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100 blur-2xl opacity-60" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 ring-1 ring-blue-200">
              <UserPlus className="icon-dyn-sm text-blue-700" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Ajouter un pèlerin</h2>
              <p className="mt-1 text-slate-600 text-dyn-sm">
                Créer un nouveau dossier (identité, passeport, contact, etc.).
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-blue-700 text-dyn-sm group-hover:translate-x-0.5 transition">
            Continuer <span aria-hidden>→</span>
          </div>
        </NavLink>

        {/* Liste */}
        <NavLink
          to="liste"
          className={({ isActive }) =>
            [
              "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition",
              "border-slate-200 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/20",
              isActive ? "ring-2 ring-blue-300 bg-blue-50/40" : "",
            ].join(" ")
          }
        >
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-blue-100 blur-2xl opacity-60" />
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 ring-1 ring-blue-200">
              <ListChecks className="icon-dyn-sm text-blue-700" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Liste des pèlerins</h2>
              <p className="mt-1 text-slate-600 text-dyn-sm">
                Rechercher, filtrer et modifier les dossiers existants.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-blue-700 text-dyn-sm group-hover:translate-x-0.5 transition">
            Ouvrir <span aria-hidden>→</span>
          </div>
        </NavLink>
      </section>

      {/* Sous-routes (ajouter / liste) */}
      <Outlet />
    </div>
  );
}
