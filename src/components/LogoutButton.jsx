import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth";
import { motion } from "framer-motion";

/**
 * Props:
 * - variant: "brand" | "danger" | "primary" | "emerald" | "slate"
 * - className: string
 */
export default function LogoutButton({ className = "", variant = "brand" }) {
  const nav = useNavigate();
  const [clicked, setClicked] = useState(false);

  function handleLogout() {
    setClicked(true);
    setTimeout(() => {
      clearSession();
      nav("/login", { replace: true });
    }, 700);
  }

  const variants = {
    // Dégradé bleu → émeraude (thème BMVT)
    brand:
      "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white",
    // Rouge (danger classique)
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white",
    // Bleu
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",
    // Émeraude
    emerald:
      "bg-emerald-600 hover:bg-emerald-700 text-white",
    // Sobre
    slate:
      "bg-slate-800 hover:bg-slate-900 text-white",
  };

  return (
    <motion.button
      onClick={handleLogout}
      animate={clicked ? { rotate: 360, opacity: 0, scale: 0.5 } : { rotate: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className={[
        "px-4 py-2 rounded-lg shadow-md font-semibold transition-colors",
        variants[variant] || variants.brand,
        className,
      ].join(" ")}
    >
      Se déconnecter
    </motion.button>
  );
}
