// src/services/api.js

// URL de ton backend Render
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://hadjbackend.onrender.com";

/**
 * Wrapper fetch pour appeler l’API backend
 * @param {string} path - ex: "/api/auth/login"
 * @param {object} options - { method, body, headers, ... }
 */
export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    credentials: "include", // si tu utilises des cookies côté backend
  };

  if (options.body !== undefined) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // pas de JSON -> on laisse data = null
  }

  if (!res.ok) {
    const message =
      (data && data.message) ||
      `Erreur API (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
