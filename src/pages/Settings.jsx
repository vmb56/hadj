// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [notif, setNotif] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-dyn">
      {/* En-tête claire */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl p-2 ring-1"
            style={{
              background: "rgba(191,219,254,.35)",
              borderColor: "rgba(191,219,254,.9)",
              color: "#1d4ed8",
            }}
          >
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-dyn-title font-extrabold text-slate-900">
              Paramètres
            </h1>
            <p className="mt-1 text-dyn-sm text-slate-600">
              Gérez vos préférences d’affichage et la sécurité du compte.
            </p>
          </div>
        </div>
      </div>

      {/* Bloc préférences d’affichage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900">Préférences d’affichage</h2>

        <label className="flex items-center justify-between border-b border-slate-200 pb-3 text-slate-700 text-sm">
          <span>Mode sombre</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="h-4 w-4 accent-sky-600"
          />
        </label>

        <label className="flex items-center justify-between text-slate-700 text-sm">
          <span>Notifications de réussite / erreur</span>
          <input
            type="checkbox"
            checked={notif}
            onChange={(e) => setNotif(e.target.checked)}
            className="h-4 w-4 accent-sky-600"
          />
        </label>
      </section>

      {/* Bloc sécurité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-slate-900">Compte & sécurité</h2>
        <p className="text-dyn-sm text-slate-700">
          Vous pouvez changer votre mot de passe, gérer vos sessions ou activer
          la double authentification ici.
        </p>
        <button
          className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:brightness-110"
        >
          Gérer le compte
        </button>
      </section>
    </div>
  );
}
