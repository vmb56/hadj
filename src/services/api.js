// Petit helper pour appeler ton backend
const BASE_URL =
  import.meta?.env?.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export async function apiFetch(path, { method = "GET", body, headers, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: "include", // si tu utilises des cookies côté API
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { BASE_URL };
