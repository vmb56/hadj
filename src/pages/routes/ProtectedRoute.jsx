import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../../services/auth";

/**
 * Bloque l'accès si aucun token n'est présent.
 * - Redirige vers /login
 * - Conserve la route de provenance (state.from), utile pour revenir après login.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/Login" replace state={{ from: location }} />;
  }
  return <Outlet />; // rend les routes enfants si authentifié
}
