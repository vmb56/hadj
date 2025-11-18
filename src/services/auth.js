// src/services/auth.js
import { apiFetch } from "./api";

const TOKEN_KEY = "bmvt_token";
const USER_KEY  = "bmvt_user";

/**
 * Enregistre un utilisateur (inscription)
 */
export async function registerUser(payload) {
  // payload: { name, email, role, password }
  return apiFetch("/api/auth/register", { method: "POST", body: payload });
}

/**
 * Connecte un utilisateur (login)
 */
export async function loginUser({ email, password }) {
  return apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
}

/**
 * Sauvegarde la session selon l’option “Se souvenir de moi”.
 * @param {object} params - { token, user, remember }
 */
export function saveSession({ token, user, remember = true }) {
  if (!token || !user) return;

  const data = JSON.stringify(user);

  try {
    if (remember) {
      // 🔹 session persistante
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, data);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } else {
      // 🔹 session temporaire (expire à la fermeture du navigateur)
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, data);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error("Erreur en sauvegardant la session :", e);
    // fallback simple
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, data);
  }
}

/**
 * Récupère le token actif (localStorage ou sessionStorage)
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Récupère l’utilisateur actif (localStorage ou sessionStorage)
 */
export function getUser() {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Supprime la session active (logout)
 */
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn("Erreur lors du nettoyage de session", e);
  }
}

// (optionnel) si tu utilises encore getSession quelque part
export function getSession() {
  try {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return null;
    return { token, user };
  } catch {
    return null;
  }
}
