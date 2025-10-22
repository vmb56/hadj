import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Voyage() {
  const baseTab =
    "px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap";
  const activeTab =
    "bg-orange-500 text-white shadow";
  const idleTab =
    "bg-white/10 hover:bg-white/20 text-slate-200";

  return (
    <div className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur shadow-lg text-white space-y-6">
      <h1 className="text-2xl font-bold text-orange-400">Voyage</h1>
      <p className="text-slate-300">
        Gérez les informations sur les <strong>vols</strong> et les <strong>chambres</strong> des pèlerins.
      </p>

      {/* Onglets = liens de route */}
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

      {/* Ici s’affichent les sous-pages */}
      <div className="mt-2">
        <Outlet />
      </div>
    </div>
  );
}
