// src/pages/Profile.jsx
import React from "react";
import { UserCircle2 } from "lucide-react";

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 text-dyn">
      {/* En-tête (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 ring-1" style={{ background: "rgba(191,219,254,.35)", borderColor: "rgba(191,219,254,.9)", color: "#1d4ed8" }}>
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-dyn-title font-extrabold text-slate-900">Mon profil</h1>
            <p className="mt-1 text-dyn-sm text-slate-600">
              Gérer vos informations et préférences d’affichage.
            </p>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Informations personnelles</h2>
        <div className="mt-3 grid gap-2 text-dyn-sm text-slate-700">
          <p><strong className="text-slate-900">Nom complet :</strong> Valy Bamba</p>
          <p><strong className="text-slate-900">Email :</strong> valybamba56@gmail.com</p>
          <p><strong className="text-slate-900">Rôle :</strong> Administrateur</p>
          <p><strong className="text-slate-900">Antenne :</strong> Pigier CI – 4.0</p>
        </div>
      </section>

      {/* Préférences */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Préférences</h2>
        <ul className="mt-3 space-y-2 text-dyn-sm text-slate-700">
          <li>• Mode sombre activé par défaut</li>
          <li>• Notifications par toast en cas de succès ou d’erreur</li>
          <li>• Langue : Français</li>
        </ul>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:brightness-110"
        >
          Modifier mes informations
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50"
        >
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}
