import React, { useState } from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [notif, setNotif] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Settings className="h-8 w-8 text-sky-400" />
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
      </header>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Préférences d’affichage</h2>

        <label className="flex items-center justify-between border-b border-white/5 pb-3 text-slate-300 text-sm">
          <span>Mode sombre</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
        </label>

        <label className="flex items-center justify-between text-slate-300 text-sm">
          <span>Notifications de réussite/erreur</span>
          <input
            type="checkbox"
            checked={notif}
            onChange={(e) => setNotif(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Compte & sécurité</h2>
        <p className="text-slate-400 text-sm">
          Vous pouvez changer votre mot de passe, gérer vos sessions ou activer
          la double authentification ici.
        </p>
        <button className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow hover:from-sky-700 hover:to-indigo-700">
          Gérer le compte
        </button>
      </div>
    </div>
  );
}
