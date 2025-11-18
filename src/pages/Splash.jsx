// src/pages/Splash.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // durée d'affichage de l'animation (en ms)
    const t = setTimeout(() => {
      navigate("/dashboard"); // route de destination
    }, 2500);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white space-y-6">
        {/* Logo / nom appli */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-400/40 flex items-center justify-center">
            <span className="text-2xl">🕋</span>
          </div>
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Bakayoko Mawa
            </p>
            <p className="text-lg font-extrabold">
              Voyages &amp; Tourismes
            </p>
          </div>
        </div>

        {/* Animation type loader */}
        <div className="flex items-center justify-center gap-2">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>

        {/* Texte */}
        <p className="text-sm text-slate-300">
          Préparation du tableau de bord…
        </p>
      </div>

      {/* Styles de l’animation */}
      <style>{`
        .loader-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #38bdf8;
          animation: bounceDot 0.9s infinite ease-in-out;
        }
        .loader-dot:nth-child(2) { animation-delay: .15s; }
        .loader-dot:nth-child(3) { animation-delay: .30s; }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
