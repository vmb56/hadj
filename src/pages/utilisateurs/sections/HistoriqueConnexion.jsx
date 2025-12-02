// src/components/HistoriqueConnexion.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ================= CONFIG API ================= */
// Lis VITE_API_URL (vite) ou REACT_APP_API_URL (CRA) sinon backend Render
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_API_URL || process.env.REACT_APP_API_URL)) ||
  "https://hadjbackend.onrender.com";

// Endpoints (côté serveur, expose-les ainsi)
const LOGS_API = "/api/admin/auth/logs";          // GET ?limit=50
const SESSIONS_API = "/api/admin/auth/sessions";  // GET
const REVOKE_API = (id) => `/api/admin/auth/sessions/${id}`; // DELETE

const REFRESH_MS = 20000; // 20s
const TOKEN_KEY = "bmvt_token";

/* ============== axios instance avec token ============== */
const api = axios.create({
  baseURL: API_BASE.replace(/\/+$/, ""),
  withCredentials: false, // on s'appuie sur le Bearer token bmvt_token
});

api.interceptors.request.use((cfg) => {
  try {
    const tk = localStorage.getItem(TOKEN_KEY);
    if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
  } catch {}
  return cfg;
});

/* ================== helpers ================== */
// accepte différents schémas renvoyés par le back
const pickItems = (x) => (Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : []);

const normLog = (l) => ({
  id: l.id ?? l._id ?? `${l.user}-${l.date}`,
  user: l.user ?? l.email ?? l.username ?? "—",
  date: l.date ?? l.createdAt ?? l.when ?? null,
  ip: l.ip ?? l.ipAddress ?? "—",
  statut: l.status ?? l.statut ?? (l.ok ? "Succès" : "Échec"),
});

const normSession = (s) => ({
  id: s.id ?? s.sid ?? s._id ?? s.tokenId ?? "—",
  user: s.user ?? s.email ?? s.username ?? "—",
  ip: s.ip ?? s.ipAddress ?? "—",
  userAgent: s.userAgent ?? s.ua ?? "—",
  startedAt: s.startedAt ?? s.createdAt ?? null,
  lastSeenAt: s.lastSeenAt ?? s.lastActivityAt ?? s.updatedAt ?? null,
  expiresAt: s.expiresAt ?? s.expireAt ?? s.exp ?? null,
  isActive:
    typeof s.isActive === "boolean"
      ? s.isActive
      : s.active ?? (s.expiresAt ? Date.parse(s.expiresAt) > Date.now() : true),
});

function truthy(v) {
  if (typeof v === "string") return v === "true" || v === "1" || v === "yes";
  return !!v;
}
function isExpired(expiresAt) {
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}
function formatDT(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return String(s);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
function truncateMid(str, head = 6, tail = 4) {
  if (!str) return "—";
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

/* ================== UI bits ================== */
function Th({ children, className = "" }) {
  return <th className={["text-left px-4 py-3 whitespace-nowrap", className].join(" ")}>{children}</th>;
}
function Td({ children, colSpan, className = "" }) {
  return (
    <td colSpan={colSpan} className={["px-4 py-3 whitespace-nowrap align-top", className].join(" ")}>
      {children}
    </td>
  );
}
function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200 text-slate-700">
      {children}
    </span>
  );
}
function StatusPill({ status, label }) {
  const s = String(status || "").toLowerCase();
  const ok = s.includes("succès") || s.includes("success") || s.includes("ok") || s.includes("200");
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  return (
    <span
      className={
        base +
        " " +
        (ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200")
      }
    >
      <span className={"mr-1 h-1.5 w-1.5 rounded-full " + (ok ? "bg-emerald-500" : "bg-rose-500")} />
      {label ?? (ok ? "Succès" : "Échec")}
    </span>
  );
}
function SessionBadge({ active }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 " +
        (active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200")
      }
    >
      <span className={"mr-1 h-1.5 w-1.5 rounded-full " + (active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
      {active ? "Actif" : "Expiré"}
    </span>
  );
}

/* ================== Composant ================== */
export default function HistoriqueConnexion() {
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [revokingId, setRevokingId] = useState(null);
  const [notice, setNotice] = useState(null); // {text,type}

  function showNotice(text, type = "success") {
    setNotice({ text, type });
    clearTimeout(showNotice._t);
    showNotice._t = setTimeout(() => setNotice(null), 2500);
  }

  async function fetchData() {
    try {
      setLoading(true);
      setErr("");

      // GET logs (support ?limit) et sessions
      const [logsRes, sessRes] = await Promise.allSettled([
        api.get(LOGS_API, { params: { limit: 50 } }),
        api.get(SESSIONS_API),
      ]);

      if (logsRes.status === "fulfilled") {
        setLogs(pickItems(logsRes.value?.data).map(normLog));
      }
      if (sessRes.status === "fulfilled") {
        setSessions(pickItems(sessRes.value?.data).map(normSession));
      }
    } catch (e) {
      console.error("[HistoriqueConnexion] fetch error:", e);
      setErr("Impossible de récupérer toutes les informations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const activeCount = useMemo(
    () => sessions.filter((s) => truthy(s.isActive) && !isExpired(s.expiresAt)).length,
    [sessions]
  );

  async function revokeSession(id) {
    try {
      setRevokingId(id);
      await api.delete(REVOKE_API(id));
      showNotice("Session terminée.", "success");
      await fetchData();
    } catch (e) {
      console.error("[revokeSession]", e);
      showNotice("Échec de la révocation.", "error");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="mt-4.space-y-6 text-dyn">
      {/* ENTÊTE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-dyn-title font-extrabold text-slate-900">Historique de connexion</h3>
            <p className="text-dyn-sm text-slate-600">
              Tentatives récentes & sessions actives. Actualisation automatique toutes les {REFRESH_MS / 1000}s.
            </p>
            {err && <p className="mt-2 text-amber-700 text-dyn-sm">{err}</p>}
          </div>
          <div className="flex flex-wrap gap-2 text-dyn-sm">
            <Chip>
              Sessions actives : <strong className="ml-1 text-slate-900">{activeCount}</strong>
            </Chip>
            <Chip>
              Derniers logs : <strong className="ml-1 text-slate-900">{logs?.length ?? 0}</strong>
            </Chip>
            <Chip>{loading ? "Mise à jour…" : "À jour"}</Chip>
          </div>
        </div>
      </div>

      {/* LOGS */}
      {/* ... (tout le reste de ton composant est inchangé) ... */}

      {/* TOAST */}
      {notice && (
        <div
          className={
            "fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-xs rounded-xl px-4 py-3 text-dyn-sm shadow-lg text-white " +
            (notice.type === "error" ? "bg-rose-600" : "bg-emerald-600")
          }
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
