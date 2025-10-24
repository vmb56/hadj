// src/pages/SettingsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Settings, Moon, Sun, Bell, BellOff, Shield, KeyRound, LogOut, X } from "lucide-react";

/* ===== Petit système de toasts (sans lib) ===== */
function useToasts(enabled = true) {
  const [items, setItems] = useState([]);
  function pushToast({ title = "Info", desc = "", tone = "info", timeout = 2500 }) {
    if (!enabled) return;
    const id = Math.random().toString(36).slice(2);
    setItems((arr) => [...arr, { id, title, desc, tone }]);
    window.setTimeout(() => setItems((arr) => arr.filter((t) => t.id !== id)), timeout);
  }
  const api = useMemo(() => ({ push: pushToast, clear: () => setItems([]) }), [enabled]);
  const node = (
    <div className="fixed z-[60] right-4 top-4 space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={[
            "rounded-xl border px-4 py-3 shadow-md w-[min(92vw,360px)] backdrop-blur bg-white/90",
            t.tone === "success" && "border-emerald-200",
            t.tone === "error" && "border-rose-200",
            t.tone === "info" && "border-blue-200",
          ].filter(Boolean).join(" ")}
        >
          <div className="flex items-start gap-2 text-slate-800">
            <span className="mt-0.5">
              {t.tone === "success" ? "✅" : t.tone === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div className="min-w-0">
              <div className="font-semibold">{t.title}</div>
              {t.desc ? <div className="text-sm text-slate-600">{t.desc}</div> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  return { push: api.push, clear: api.clear, Toasts: () => node };
}

/* ===== Helpers dark mode ===== */
function applyDark(mode) {
  try {
    document.documentElement.classList.toggle("dark", mode);
  } catch {}
}
function readLS(k, fallback) {
  try {
    const raw = localStorage.getItem(k);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(() => readLS("pref.darkMode", true));
  const [notif, setNotif] = useState(() => readLS("pref.notif", true));
  const { push, Toasts } = useToasts(notif);

  /* appliquer le thème au chargement + quand ça change */
  useEffect(() => { applyDark(darkMode); }, []); // initial
  useEffect(() => { applyDark(darkMode); writeLS("pref.darkMode", darkMode);
    push({ tone: "info", title: `Mode ${darkMode ? "sombre" : "clair"} activé` });
  }, [darkMode]); // on change

  useEffect(() => { writeLS("pref.notif", notif);
    push({ tone: "info", title: `Notifications ${notif ? "activées" : "désactivées"}` });
  }, [notif]);

  /* ===== Modale “Gérer le compte” ===== */
  const [openModal, setOpenModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const canSubmit = pwdForm.current && pwdForm.next && pwdForm.confirm && pwdForm.next === pwdForm.confirm;

  function submitPassword(e) {
    e.preventDefault();
    if (!canSubmit) {
      push({ tone: "error", title: "Formulaire incomplet", desc: "Vérifie les champs." });
      return;
    }
    // Ici tu appellerais ton API: await api.changePassword(pwdForm)
    push({ tone: "success", title: "Mot de passe mis à jour" });
    setPwdForm({ current: "", next: "", confirm: "" });
    setOpenModal(false);
  }

  function logoutAll() {
    // Ici tu appellerais ton API: await api.logoutAll()
    push({ tone: "success", title: "Déconnecté de tous les appareils" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-dyn">
      <Toasts />

      {/* En-tête claire (thème bleu) */}
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
            <h1 className="text-dyn-title font-extrabold text-slate-900">Paramètres</h1>
            <p className="mt-1 text-dyn-sm text-slate-600">
              Gérez vos préférences d’affichage et la sécurité du compte.
            </p>
          </div>
        </div>
      </div>

      {/* Préférences d’affichage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900">Préférences d’affichage</h2>

        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-slate-700 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <span>Mode sombre</span>
          </div>
          <button
            onClick={() => setDarkMode((v) => !v)}
            className="rounded-xl bg-sky-600 px-3 py-1.5 text-white font-semibold hover:brightness-110"
          >
            {darkMode ? "Désactiver" : "Activer"}
          </button>
        </div>

        <div className="flex items-center justify-between text-slate-700 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              {notif ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </span>
            <span>Notifications de réussite / erreur</span>
          </div>
          <button
            onClick={() => setNotif((v) => !v)}
            className="rounded-xl bg-sky-600 px-3 py-1.5 text-white font-semibold hover:brightness-110"
          >
            {notif ? "Désactiver" : "Activer"}
          </button>
        </div>
      </section>

      {/* Sécurité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-slate-900">Compte & sécurité</h2>
        <p className="text-dyn-sm text-slate-700">
          Changez votre mot de passe, gérez vos sessions ou activez la double authentification.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:brightness-110"
          >
            <Shield className="h-4 w-4" />
            Gérer le compte
          </button>
          <button
            onClick={logoutAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Déconnecter toutes les sessions
          </button>
        </div>
      </section>

      {/* Modale sécurité */}
      {openModal && (
        <Modal onClose={() => setOpenModal(false)} title="Sécurité du compte">
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="grid gap-3">
              <Labelled label="Mot de passe actuel">
                <input
                  type="password"
                  className="input"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </Labelled>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Labelled label="Nouveau mot de passe">
                  <input
                    type="password"
                    className="input"
                    value={pwdForm.next}
                    onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
                    placeholder="Au moins 8 caractères"
                    required
                    minLength={8}
                  />
                </Labelled>
                <Labelled label="Confirmer le mot de passe">
                  <input
                    type="password"
                    className="input"
                    value={pwdForm.confirm}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                    placeholder="Ressaisir le nouveau mot de passe"
                    required
                    minLength={8}
                  />
                </Labelled>
              </div>

              {pwdForm.next && pwdForm.confirm && pwdForm.next !== pwdForm.confirm ? (
                <div className="text-rose-600 text-sm">Les mots de passe ne correspondent pas.</div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpenModal(false)} className="btn-outline">
                Annuler
              </button>
              <button type="submit" className="btn-blue" disabled={!canSubmit}>
                <KeyRound className="h-4 w-4 mr-1.5 inline-block" />
                Mettre à jour
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Styles utilitaires (tailwind @apply) */}
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-sky-400; }
        .btn-blue { @apply inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50; }
        .btn-outline { @apply inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50; }
      `}</style>
    </div>
  );
}

/* ===== Petits composants ===== */

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(640px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Labelled({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
