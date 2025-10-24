import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth";
import { motion } from "framer-motion";

export default function LogoutButton({ className = "" }) {
  const nav = useNavigate();
  const [clicked, setClicked] = useState(false);

  function handleLogout() {
    setClicked(true);
    setTimeout(() => {
      clearSession();
      nav("/login", { replace: true });
    }, 700);
  }

  return (
    <motion.button
      onClick={handleLogout}
      animate={clicked ? { rotate: 360, opacity: 0, scale: 0.5 } : { rotate: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className={`bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 ${className}`}
    >
      Se déconnecter
    </motion.button>
  );
}
