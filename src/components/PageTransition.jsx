// src/components/PageTransition.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition() {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Dès que l'URL change → on lance la transition
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
    }, 700); // durée de l'anim en ms (doit matcher animation-duration)

    return () => clearTimeout(timer);
  }, [location]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Rideau qui se lève */}
      <div className="transition-overlay">
        {/* Contenu centré */}
        <div className="overlay-inner">
          <div className="brand-bubble">
            <span className="brand-icon">🕋</span>
          </div>
          <div className="brand-text">
            <p className="brand-sub">Bakayoko Mawa</p>
            <p className="brand-main">Voyages &amp; Tourismes</p>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .transition-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top, #0ea5e9 0, #0f172a 45%, #020617 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: curtainUp 0.7s ease-in-out forwards;
          transform-origin: top center;
        }

        .overlay-inner {
          text-align: center;
          color: white;
          pointer-events: none;
        }

        .brand-bubble {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          border: 2px solid rgba(56, 189, 248, 0.7);
          background: radial-gradient(circle at 30% 0%, rgba(56, 189, 248, .4), rgba(15, 23, 42, .9));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.9),
            0 15px 40px rgba(8, 47, 73, 0.8);
          animation: pulseLogo 1.1s ease-in-out infinite;
        }

        .brand-icon {
          font-size: 30px;
        }

        .brand-text {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .brand-sub {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .30em;
          color: rgba(148, 163, 184, 0.8);
          margin-bottom: 2px;
        }

        .brand-main {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: .04em;
          color: #e5e7eb;
        }

        /* Rideau qui se lève */
        @keyframes curtainUp {
          0% {
            transform: translateY(0%);
            opacity: 1;
          }
          70% {
            transform: translateY(-5%);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        /* Petit effet de "respiration" du logo */
        @keyframes pulseLogo {
          0%, 100% {
            transform: scale(1);
            box-shadow:
              0 0 0 1px rgba(15, 23, 42, 0.9),
              0 15px 40px rgba(8, 47, 73, 0.8);
          }
          50% {
            transform: scale(1.05);
            box-shadow:
              0 0 0 1px rgba(56, 189, 248, 0.8),
              0 20px 55px rgba(8, 47, 73, 0.95);
          }
        }
      `}</style>
    </div>
  );
}
