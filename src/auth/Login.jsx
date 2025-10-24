// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { Eye, EyeOff, LogIn, CheckCircle2, Mail, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, saveSession } from "../services/auth";
import { motion, AnimatePresence } from "framer-motion";

/* mini-toasts */
function useToasts() {
  const [toasts, set] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    set((a) => [...a, { id, ...t }]);
    setTimeout(() => set((a) => a.filter((x) => x.id !== id)), t.timeout ?? 4000);
  };
  const Node = () => (
    <div className="fixed right-4 top-4 z-[70] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl border px-4 py-3 w-[min(92vw,380px)] bg-white/90 backdrop-blur shadow-lg ${
            t.tone === "error" ? "border-rose-200" : "border-blue-200"
          }`}
        >
          <div className="font-semibold text-slate-900">{t.title}</div>
          {t.desc ? <div className="text-sm text-slate-600">{t.desc}</div> : null}
        </div>
      ))}
    </div>
  );
  return { push, Toasts: Node };
}

export default function LoginPage() {
  const { push, Toasts } = useToasts();
  const nav = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/tableau-de-bord";

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // pré-remplissage remember
  const rememberedEmail = typeof window !== "undefined" ? localStorage.getItem("bmvt_email") || "" : "";
  const rememberedPref = typeof window !== "undefined" ? localStorage.getItem("bmvt_remember") === "1" : true;

  const [form, setForm] = useState({ email: rememberedEmail, password: "", remember: rememberedPref });

  // états overlay succès
  const [ok, setOk] = useState(false);
  const [userName, setUserName] = useState("");

  const canSubmit = /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      push({ tone: "error", title: "Champs invalides", desc: "Vérifie email & mot de passe." });
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser({ email: form.email.trim(), password: form.password });

      // session + remember
      saveSession({ token: data?.token, user: data?.user, remember: form.remember });
      try {
        if (form.remember) {
          localStorage.setItem("bmvt_email", form.email.trim());
          localStorage.setItem("bmvt_remember", "1");
        } else {
          localStorage.removeItem("bmvt_email");
          localStorage.setItem("bmvt_remember", "0");
        }
      } catch {}

      const name = data?.user?.name || data?.user?.email || form.email;
      setUserName(name);
      push({ title: `Bienvenue, ${name} !` });

      setOk(true);
      setTimeout(() => {
        nav(from, { replace: true });
      }, 950);
    } catch (err) {
      push({ tone: "error", title: "Connexion échouée", desc: err.message || "Réessaie." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Toasts />

      {/* === FOND ANIMÉ === */}
      <div className="absolute inset-0 -z-10">
        {/* gradient principal */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#dbeafe] via-white to-[#c7d2fe]" />
        {/* blobs */}
        <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-400/25 blur-[70px] animate-float-slow" />
        <div className="absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-indigo-400/25 blur-[80px] animate-float-slower" />
        {/* lignes radiales */}
        <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_10%,rgba(59,130,246,0.18),transparent_70%)]" />
      </div>

      {/* === CONTENEUR CENTRÉ === */}
      <div className="grid min-h-screen place-items-center px-4">
        {/* CARTE GLASS AVEC CADRE ANIMÉ */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative w-full max-w-[520px]"
        >
          {/* glow animé */}
          <div className="pointer-events-none absolute -inset-[2px] rounded-[28px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60 blur-md" />
          {/* bordure gradient animée */}
          <div className="absolute -inset-[1px] rounded-[28px] bg-[conic-gradient(from_180deg_at_50%_50%,#60a5fa_0%,#818cf8_25%,#60a5fa_50%,#3b82f6_75%,#60a5fa_100%)] animate-rotate-slow opacity-30" />
          
          {/* contenu carte */}
          <div className="relative rounded-[26px] border border-white/60 bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {/* en-tête */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center shadow">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Connexion
                </h1>
                <p className="text-slate-600 text-sm">Accède à ton espace BMVT</p>
              </div>
            </div>

            {/* formulaire */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* email */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="relative group">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  </span>
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="ex: admin@bmvt.ci"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                  {/* anneau pulsé au focus */}
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-blue-200 opacity-0 group-focus-within:animate-pulse-ring" />
                </div>
              </label>

              {/* password */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">Mot de passe</span>
                <div className="relative group">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  </span>
                  <input
                    type={show ? "text" : "password"}
                    className="input pl-10 pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="btn-eye"
                    aria-label={show ? "Masquer" : "Afficher"}
                  >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-blue-200 opacity-0 group-focus-within:animate-pulse-ring" />
                </div>
              </label>

              {/* remember */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300"
                  />
                  <span className="text-sm text-slate-600">Se souvenir de moi</span>
                </label>
              </div>

              {/* submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit || loading}
                className="btn-blue relative inline-flex w-full items-center justify-center gap-2 overflow-hidden"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                {/* shimmer */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)] animate-shimmer" />
                <LogIn className="h-4 w-4" />
                {loading ? "Connexion..." : "Se connecter"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Overlay d’animation de succès */}
      <AnimatePresence>
        {ok && (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-white/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <CheckCircle2 className="h-20 w-20 text-emerald-600" />
              <div className="text-3xl font-extrabold text-slate-900 text-center">
                Bienvenue, {userName?.split(" ")[0] || "!"}
              </div>
              <div className="text-slate-600">Connexion réussie</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles utilitaires */}
      <style>{`
        @keyframes float-slow   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.02)} }
        @keyframes float-slower { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(16px)  scale(1.03)} }
        .animate-float-slow   { animation: float-slow 9s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }

        @keyframes rotate-slow { to { transform: rotate(360deg); } }
        .animate-rotate-slow { animation: rotate-slow 18s linear infinite; }

        @keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
        .animate-shimmer { animation: shimmer 1.8s ease-in-out infinite; }

        @keyframes pulse-ring {
          0%   { opacity: .0; box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
          40%  { opacity: 1;  box-shadow: 0 0 0 6px rgba(59,130,246,.25); }
          100% { opacity: 0;  box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
        .group:focus-within .animate-pulse-ring { animation: pulse-ring .9s ease-out 1; }

        .input { 
          @apply w-full rounded-xl border bg-white/95 shadow-sm 
                 border-slate-200 outline-none 
                 py-3 px-3 text-base sm:text-[15px]
                 ring-2 ring-transparent
                 placeholder:text-slate-400
                 focus:border-blue-300 focus:ring-blue-200 transition;
        }
        .btn-blue { 
          @apply rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                 px-5 py-3.5 font-semibold text-white shadow 
                 hover:from-blue-700 hover:to-indigo-700 
                 disabled:opacity-50 disabled:cursor-not-allowed;
        }
        .btn-eye { 
          @apply absolute right-3 top-1/2 -translate-y-1/2 
                 text-slate-500 hover:text-slate-700;
        }
      `}</style>
    </div>
  );
}
