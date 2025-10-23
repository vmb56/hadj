// src/pages/Voyage.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Voyage() {
  const baseTab =
    "px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap ring-1";
  const activeTab =
    "bg-blue-50 text-blue-800 ring-blue-200";
  const idleTab =
    "bg-white hover:bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className="space-y-6 text-dyn">
      {/* En-tête (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Voyage</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Gérez les informations sur les <strong>vols</strong> et les <strong>chambres</strong> des pèlerins.
        </p>
      </div>

      {/* Onglets */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <NavLink
            to="vols"
            className={({ isActive }) =>
              `${baseTab} ${isActive ? activeTab : idleTab}`
            }
          >
            ✈️ Vols
          </NavLink>
          <NavLink
            to="chambres"
            className={({ isActive }) =>
              `${baseTab} ${isActive ? activeTab : idleTab}`
            }
          >
            🏨 Chambres
          </NavLink>
        </div>
      </div>

      {/* Sous-pages */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
