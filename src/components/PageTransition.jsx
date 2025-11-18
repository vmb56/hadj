// src/components/PageTransition.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition() {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Dès que l'URL change → on affiche l'overlay
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
    }, 600); // durée de la transition en ms

    return () => clearTimeout(timer);
  }, [location]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-3 text-white">
        {/* Petit logo/icone */}
        <div className="h-12 w-12 rounded-2xl border border-sky-400/60 bg-sky-500/10 flex items-center justify-center">
          <span className="text-2xl">🕋</span>
        </div>
        {/* Loader */}
        <div className="flex gap-2">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
        <p className="text-xs sm:text-sm text-slate-200/80">
          Transition vers la page suivante…
        </p>
      </div>

      <style>{`
        .loader-dot{
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #38bdf8;
          animation: loaderBounce .9s infinite ease-in-out;
        }
        .loader-dot:nth-child(2){ animation-delay: .15s; }
        .loader-dot:nth-child(3){ animation-delay: .30s; }

        @keyframes loaderBounce{
          0%,80%,100%{ transform: translateY(0); opacity:.4; }
          40%{ transform: translateY(-7px); opacity:1; }
        }
      `}</style>
    </div>
  );
}
