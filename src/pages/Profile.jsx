import React from "react";
import { UserCircle2 } from "lucide-react";

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3 border-b border-white/10 pb-4">
        <UserCircle2 className="h-8 w-8 text-sky-400" />
        <h1 className="text-2xl font-bold text-white">Mon profil</h1>
      </header>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Informations personnelles</h2>
        <div className="space-y-2 text-slate-300 text-sm">
          <p><strong>Nom complet :</strong> Valy Bamba</p>
          <p><strong>Email :</strong> valybamba56@gmail.com</p>
          <p><strong>Rôle :</strong> Administrateur</p>
          <p><strong>Antenne :</strong> Pigier CI – 4.0</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Préférences</h2>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>• Mode sombre activé par défaut</li>
          <li>• Notifications par toast en cas de succès ou d’erreur</li>
          <li>• Langue : Français</li>
        </ul>
      </div>

      <button
        className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow hover:from-sky-700 hover:to-indigo-700"
      >
        Modifier mes informations
      </button>
    </div>
  );
}
