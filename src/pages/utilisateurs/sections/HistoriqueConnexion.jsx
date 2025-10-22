// src/components/HistoriqueConnexion.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

////////////////////////////////////////////////////////////////////////////////
// CONFIG — adapte si besoin à ton backend
const LOGS_API      = "/api/admin/auth/logs?limit=50";
const SESSIONS_API  = "/api/admin/auth/sessions";
const REVOKE_API    = (id) => `/api/admin/auth/sessions/${id}`; // DELETE
const REFRESH_MS    = 20000; // 20s
////////////////////////////////////////////////////////////////////////////////

const FALLBACK_LOGS = [
  { id: 1, user: "admin@bmvt.ci", date: "2025-10-21 09:12", ip: "102.158.10.23", statut: "Succès" },
  { id: 2, user: "omar@bmvt.ci",  date: "2025-10-20 18:45", ip: "102.158.10.23", statut: "Échec (mdp)" },
];

export default function HistoriqueConnexion() {
  const [logs, setLogs] = useState(FALLBACK_LOGS);
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

      const [logsRes, sessRes] = await Promise.allSettled([
        axios.get(LOGS_API),
        axios.get(SESSIONS_API),
      ]);

      if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value?.data)) {
        setLogs(logsRes.value.data);
      }

      if (sessRes.status === "fulfilled" && Array.isArray(sessRes.value?.data)) {
        setSessions(sessRes.value.data);
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
      await axios.delete(REVOKE_API(id));
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
    <div className="mt-4 space-y-6">
      {/* ENTÊTE / META */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-orange-400">Historique de connexion</h3>
            <p className="text-slate-300 text-sm">
              Tentatives récentes & sessions actives. Actualisation automatique toutes les {REFRESH_MS/1000}s.
            </p>
            {err && <p className="mt-2 text-amber-300 text-sm">{err}</p>}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Chip>Sessions actives : <strong className="ml-1">{activeCount}</strong></Chip>
            <Chip>Derniers logs : <strong className="ml-1">{logs?.length ?? 0}</strong></Chip>
            <Chip>{loading ? "Mise à jour…" : "À jour"}</Chip>
          </div>
        </div>
      </div>

      {/* LOGS — Responsive: cartes (mobile) / tableau (desktop) */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
        <h4 className="text-lg font-semibold text-amber-300">Tentatives de connexion</h4>
        <p className="text-slate-300 text-sm mb-3">Date, IP, statut.</p>

        {/* Cartes (mobile) */}
        <div className="grid gap-3 md:hidden">
          {(logs ?? []).map((l, i) => (
            <article
              key={l.id ?? i}
              className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h5 className="font-semibold text-white break-words">
                    <span className="mr-2 inline-flex min-w-[26px] justify-center rounded-full bg-white/15 px-2 py-0.5 text-xs">
                      #{i + 1}
                    </span>
                    <span className="font-mono">{l.user}</span>
                  </h5>
                  <p className="text-xs text-slate-300 mt-1">{formatDT(l.date)}</p>
                </div>
                <StatusPill status={String(l.statut || "").toLowerCase()} label={l.statut || "—"} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-400">IP</dt>
                  <dd className="font-mono break-words">{l.ip || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Statut</dt>
                  <dd>{l.statut || "—"}</dd>
                </div>
              </dl>
            </article>
          ))}
          {!logs?.length && (
            <p className="text-center text-slate-300">Aucune tentative récente.</p>
          )}
        </div>

        {/* Tableau (desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[720px] border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="bg-orange-500/10 text-amber-300 uppercase tracking-wide">
                <Th>#</Th><Th>Utilisateur</Th><Th>Date</Th><Th>IP</Th><Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((l, i) => (
                <tr key={l.id ?? i} className="bg-white/10 hover:bg-white/15 transition">
                  <Td>{i + 1}</Td>
                  <Td className="font-mono">{l.user}</Td>
                  <Td className="tabular-nums">{formatDT(l.date)}</Td>
                  <Td className="font-mono">{l.ip || "—"}</Td>
                  <Td>
                    <StatusPill status={String(l.statut || "").toLowerCase()} label={l.statut || "—"} />
                  </Td>
                </tr>
              ))}
              {!logs?.length && (
                <tr>
                  <Td colSpan={5} className="text-slate-300">Aucune tentative récente.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SESSIONS — Responsive: cartes (mobile) / tableau (desktop) */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
        <h4 className="text-lg font-semibold text-emerald-300">Sessions utilisateur</h4>
        <p className="text-slate-300 text-sm mb-3">Actives/expirées, dernière activité, périphérique.</p>

        {/* Cartes (mobile) */}
        <div className="grid gap-3 md:hidden">
          {(sessions ?? []).map((s, i) => {
            const active = truthy(s.isActive) && !isExpired(s.expiresAt);
            return (
              <article
                key={s.id ?? i}
                className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white break-words">
                      <span className="mr-2 inline-flex min-w-[26px] justify-center rounded-full bg-white/15 px-2 py-0.5 text-xs">
                        #{i + 1}
                      </span>
                      <span className="font-mono">{s.user || "—"}</span>
                    </h5>
                    <p className="text-xs text-slate-300 mt-1">
                      ID: <span className="font-mono">{truncateMid(String(s.id ?? "—"), 6, 5)}</span>
                    </p>
                  </div>
                  <SessionBadge active={active} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-slate-400">IP</dt>
                    <dd className="font-mono break-words">{s.ip || "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Agent</dt>
                    <dd className="break-words">{s.userAgent || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Début</dt>
                    <dd className="tabular-nums">{formatDT(s.startedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Dernière activité</dt>
                    <dd className="tabular-nums">{formatDT(s.lastSeenAt)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Expire</dt>
                    <dd className="tabular-nums">{formatDT(s.expiresAt)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex justify-end">
                  <button
                    disabled={!active || revokingId === s.id}
                    onClick={() => revokeSession(s.id)}
                    className={
                      "rounded-xl border px-3 py-1.5 text-sm " +
                      (active
                        ? "border-rose-300 text-rose-200 hover:bg-rose-500/10"
                        : "border-slate-600 text-slate-400 opacity-60 cursor-not-allowed")
                    }
                  >
                    {revokingId === s.id ? "… " : ""}Terminer
                  </button>
                </div>
              </article>
            );
          })}
          {!sessions?.length && (
            <p className="text-center text-slate-300">Aucune session trouvée.</p>
          )}
        </div>

        {/* Tableau (desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[920px] border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="bg-emerald-500/10 text-emerald-300 uppercase tracking-wide">
                <Th>#</Th>
                <Th>Utilisateur</Th>
                <Th>Session ID</Th>
                <Th>IP</Th>
                <Th>Agent</Th>
                <Th>Début</Th>
                <Th>Dernière activité</Th>
                <Th>Expire</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((s, i) => {
                const active = truthy(s.isActive) && !isExpired(s.expiresAt);
                return (
                  <tr key={s.id ?? i} className="bg-white/10 hover:bg-white/15 transition">
                    <Td>{i + 1}</Td>
                    <Td className="font-mono">{s.user || "—"}</Td>
                    <Td title={s.id} className="font-mono">{truncateMid(String(s.id ?? "—"), 6, 5)}</Td>
                    <Td className="font-mono">{s.ip || "—"}</Td>
                    <Td className="max-w-[18rem] truncate" title={s.userAgent}>{s.userAgent || "—"}</Td>
                    <Td className="tabular-nums">{formatDT(s.startedAt)}</Td>
                    <Td className="tabular-nums">{formatDT(s.lastSeenAt)}</Td>
                    <Td className="tabular-nums">{formatDT(s.expiresAt)}</Td>
                    <Td><SessionBadge active={active} /></Td>
                    <Td className="text-right">
                      <button
                        disabled={!active || revokingId === s.id}
                        onClick={() => revokeSession(s.id)}
                        className={
                          "rounded-xl border px-3 py-1.5 " +
                          (active
                            ? "border-rose-300 text-rose-200 hover:bg-rose-500/10"
                            : "border-slate-600 text-slate-400 opacity-60 cursor-not-allowed")
                        }
                      >
                        {revokingId === s.id ? "… " : ""}Terminer
                      </button>
                    </Td>
                  </tr>
                );
              })}
              {!sessions?.length && (
                <tr>
                  <Td colSpan={10} className="text-slate-300">Aucune session trouvée.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TOAST */}
      {notice && (
        <div
          className={
            "fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-xs rounded-xl px-4 py-3 text-sm shadow-lg " +
            (notice.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white")
          }
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- UI bits -------------------------------- */

function Th({ children, className = "" }) {
  return (
    <th className={["text-left px-4 py-3 whitespace-nowrap", className].join(" ")}>
      {children}
    </th>
  );
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
    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
      {children}
    </span>
  );
}

function StatusPill({ status, label }) {
  const ok = status.includes("succès") || status.includes("success") || status.includes("ok");
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  return (
    <span className={base + " " + (ok
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
    )}>
      <span className={"mr-1 h-1.5 w-1.5 rounded-full " + (ok ? "bg-emerald-500" : "bg-rose-500")} />
      {label}
    </span>
  );
}

function SessionBadge({ active }) {
  return (
    <span className={
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
      (active
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        : "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300")
    }>
      <span className={
        "mr-1 h-1.5 w-1.5 rounded-full " +
        (active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")
      } />
      {active ? "Actif" : "Expiré"}
    </span>
  );
}

/* ------------------------------- Utilities -------------------------------- */

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
  // attend "YYYY-MM-DD HH:mm" ou ISO ; s'adapte si déjà ISO
  const ms = Date.parse(String(s).replace(" ", "T"));
  if (Number.isNaN(ms)) return s;
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
}

function truncateMid(str, head = 6, tail = 4) {
  if (!str) return "—";
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}
