import React, { useEffect, useMemo, useRef, useState } from "react";
import useAuthUser from "../../hooks/useAuthUser"; // { id, name, email, role }

/**
 * BMVTChatSimple.jsx — + fonctionnalités UI (backend inchangé)
 * - Recherche live (surlignage)
 * - Séparateurs de jour
 * - Badge “N nouveaux messages” + scroll-to-bottom
 * - Drag&Drop + Coller des images/fichiers
 * - Progression upload (XHR) quand pièces jointes
 * - Aide raccourcis (touche "?")
 * - Export JSON
 * - Mode compact
 */

/* ======================== helpers API ======================== */
const RAW_API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "https://hadjbackend.onrender.com";

// on retire les / de fin pour éviter les // dans les URLs
const API_BASE = String(RAW_API_BASE || "").replace(/\/+$/, "");

const API_CHAT = `${API_BASE}/api/chat`;
const TOKEN_KEY = "bmvt_token";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

const toUrl = (val) => {
  if (!val) return null;
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  if (val.startsWith("/")) return `${API_BASE}${val}`;
  return `${API_BASE}/${val}`;
};

async function apiJson(url, options = {}) {
  const token = getToken();
  const isForm = options.body instanceof FormData;
  const headers = {
    Accept: "application/json",
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { credentials: "include", ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function parseAttachments(attachments_json) {
  if (!attachments_json) return [];
  let arr;
  try {
    arr = Array.isArray(attachments_json) ? attachments_json : JSON.parse(attachments_json);
  } catch {
    return [];
  }
  return arr
    .filter(Boolean)
    .map((a, idx) => ({
      id: a.id ?? a.url ?? a.name ?? `att-${idx}`,
      name: a.name || "fichier",
      type:
        a.type ||
        (typeof a.mime === "string" && a.mime.startsWith("image/")
          ? "image"
          : a.mime?.startsWith("video/")
          ? "video"
          : "file"),
      url: toUrl(a.url),
    }));
}

function rowToMessage(row) {
  if (!row || typeof row !== "object") return null;
  const atts = parseAttachments(row.attachments_json);
  return {
    id: row.id,
    channel: row.channel,
    authorId: row.author_id ?? undefined,
    author: row.author_name,
    text: row.text ?? "",
    replyToId: row.reply_to_id ?? undefined,
    attachments: atts,
    editedAt: row.edited_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
  };
}

function genTempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ================ helpers UI ================== */
function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "??"
  );
}
function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}
function isSameDay(a, b) {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Aujourd'hui";
  if (isSameDay(d, yest)) return "Hier";
  return d.toLocaleDateString();
}
function highlight(text, query) {
  if (!query) return text;
  try {
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return text.split(re).map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}

/* ===================== Toasts ==================== */
function Toasts({ items, onClose }) {
  if (!items?.length) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[92vw]"
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-xl border p-3 backdrop-blur bg-white/80 shadow-lg",
            t.variant === "error"
              ? "border-rose-200"
              : t.variant === "warning"
              ? "border-amber-200"
              : t.variant === "success"
              ? "border-emerald-200"
              : "border-slate-200"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 w-2 h-2 rounded-full",
                t.variant === "error"
                  ? "bg-rose-500"
                  : t.variant === "warning"
                  ? "bg-amber-500"
                  : t.variant === "success"
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{t.title}</div>
              {t.body ? (
                <div className="text-xs text-slate-600 break-words mt-0.5">{t.body}</div>
              ) : null}
            </div>
            <button
              onClick={() => onClose(t.id)}
              className="text-xs px-2 py-1 rounded hover:bg-slate-100 transition"
              aria-label="Fermer notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====================== UI ======================== */
function Header({ user, onExport, compact, setCompact, query, setQuery, onHelp }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 text-white">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-white/15 ring-1 ring-white/20 grid place-items-center font-semibold">
            💬
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-wide drop-shadow-sm">
              BMVT · Chat
            </h1>
            <p className="text-[11px] sm:text-xs text-white/80">
              Recherche, export, densité, raccourcis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un message…"
            className="flex-1 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-white placeholder-white/70 outline-none focus:bg-white/25"
          />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            onClick={() => setCompact((v) => !v)}
            className="px-2 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur"
          >
            {compact ? "Normal" : "Compact"}
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur"
          >
            Exporter
          </button>
          <button
            onClick={onHelp}
            title="Aide (touche ?)"
            className="px-2 py-1.5 rounded-lg border border-white/20 bg-white/10"
          >
            ?
          </button>
          {user ? (
            <span className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur">
              {user.name}
              {user.role ? <span className="text-white/80"> · {user.role}</span> : null}
            </span>
          ) : (
            <span className="px-2 py-1 rounded-lg border border-white/20 bg-amber-300/20 text-amber-50">
              Non connecté
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function Tabs({ channels, active, onChange }) {
  return (
    <div className="sticky top-[60px] sm:top-[68px] z-30 border-b bg-white/70 backdrop-blur">
      <div className="container mx-auto px-3 py-2">
        <div className="inline-flex items-center rounded-full border bg-white shadow-sm overflow-hidden">
          {channels.map((c, idx) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition",
                  isActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50",
                  idx !== channels.length - 1 && "border-r border-slate-200/80"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const closeOnEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [item, onClose]);

  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-xs sm:text-sm shadow"
          >
            Fermer
          </button>
        </div>
        <div className="bg-white rounded-2xl p-2 shadow-2xl">
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={item.name}
              className="w-full max-h-[75svh] object-contain rounded-lg"
            />
          ) : item.type === "video" ? (
            <video src={item.url} className="w-full max-h-[75svh] rounded-lg" controls autoPlay />
          ) : (
            <div className="p-6 text-center text-sm">
              <p className="mb-3">Prévisualisation indisponible.</p>
              <a href={item.url} download={item.name} className="text-indigo-700 underline">
                Télécharger {item.name}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentsPreview({ items, onOpen }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {items.map((a, idx) => (
        <div
          key={a.id || a.url || a.name || idx}
          className="rounded-xl border bg-white p-1 overflow-hidden shadow-sm"
        >
          {a.type === "image" ? (
            <button type="button" onClick={() => onOpen(a)} className="block w-full">
              <img
                src={a.url}
                alt={a.name}
                className="w-full h-28 sm:h-32 md:h-40 object-cover rounded-lg"
              />
            </button>
          ) : a.type === "video" ? (
            <button type="button" onClick={() => onOpen(a)} className="block w-full">
              <video
                src={a.url}
                className="w-full h-28 sm:h-32 md:h-40 object-cover rounded-lg"
                muted
              />
            </button>
          ) : (
            <a
              href={a.url}
              download={a.name}
              className="block text-[11px] sm:text-xs text-indigo-700 truncate p-2"
              title={a.name}
            >
              {a.name}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function Avatar({ name, mine }) {
  return (
    <div
      className={cn(
        "h-8 w-8 rounded-full grid place-items-center text-[10px] font-semibold select-none",
        mine ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div className="sticky top-[108px] z-10">
      <div className="mx-auto my-4 flex items-center gap-2 w-fit">
        <div className="h-px w-16 bg-slate-200" />
        <div className="text-[11px] px-2 py-0.5 rounded-full bg-white border text-slate-600">
          {label}
        </div>
        <div className="h-px w-16 bg-slate-200" />
      </div>
    </div>
  );
}

function Message({
  mine,
  selected,
  author,
  text,
  time,
  replyTo,
  attachments = [],
  editedAt,
  deletedAt,
  status,
  onClick,
  onDoubleClick,
  canEdit,
  onReply,
  onEdit,
  onDelete,
  onCancel,
  onOpenAttachment,
  compact,
  query,
}) {
  const isDeleted = !!deletedAt;
  const isEdited = !!editedAt;

  const Bubble = (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={!isDeleted ? onDoubleClick : undefined}
      className={cn(
        "text-left rounded-2xl px-3.5 border shadow-sm outline-none transition relative",
        mine ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-900 border-slate-200",
        selected ? (mine ? "ring-2 ring-white/70" : "ring-2 ring-indigo-300") : "ring-0",
        isDeleted && "opacity-70",
        compact
          ? "py-1.5 max-w-[88%]"
          : "py-2.5 max-w-[72%] md:max-w-[64%] lg:max-w-[52%]"
      )}
      disabled={isDeleted}
    >
      <div
        className={cn(
          "opacity-80 mb-1 flex items-center gap-2 flex-wrap",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        <span className="font-medium">{author}</span>
        <span className="opacity-70">· {time}</span>
        {isEdited && !isDeleted && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border",
              mine ? "bg-white/15 border-white/30" : "bg-slate-50 border-slate-200"
            )}
          >
            modifié
          </span>
        )}
        {isDeleted && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border",
              mine
                ? "bg-white/15 border-white/30"
                : "bg-rose-50 border-rose-200 text-rose-700"
            )}
          >
            supprimé
          </span>
        )}
      </div>

      {replyTo && !isDeleted && (
        <div
          className={cn(
            "mb-2 rounded-lg px-2 py-1 border",
            compact ? "text-[10px]" : "text-[11px]",
            mine ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-200"
          )}
        >
          <span className="font-medium">
            Réponse à {replyTo.author ?? `#${replyTo.id}`} :
          </span>{" "}
          {replyTo.text
            ? replyTo.text.length > 120
              ? replyTo.text.slice(0, 120) + "…"
              : replyTo.text
            : "…"}
        </div>
      )}

      {isDeleted ? (
        <div className="text-sm italic opacity-80">Message supprimé</div>
      ) : (
        <>
          {text && (
            <div
              className={cn(
                "whitespace-pre-wrap",
                compact ? "text-[13px] leading-5" : "text-sm leading-6"
              )}
            >
              {highlight(text, query)}
            </div>
          )}
          {mine && (
            <div
              className={cn(
                "mt-1 opacity-80 flex items-center gap-1",
                compact ? "text-[10px]" : "text-[10px]"
              )}
            >
              <span>Statut :</span>
              <span className="uppercase">{status || "sent"}</span>
              {status === "sending" && <span aria-hidden>⏳</span>}
              {status === "sent" && <span aria-hidden>✓</span>}
              {status === "delivered" && <span aria-hidden>✓✓</span>}
              {status === "read" && (
                <span aria-hidden className="text-cyan-300">
                  ✓✓
                </span>
              )}
            </div>
          )}
          {attachments.length ? (
            <AttachmentsPreview items={attachments} onOpen={onOpenAttachment} />
          ) : null}
        </>
      )}
    </button>
  );

  return (
    <div
      className={cn(
        "relative flex items-end gap-2",
        mine ? "justify-end" : "justify-start"
      )}
    >
      {!mine && <Avatar name={author} mine={false} />}
      {Bubble}
      {mine && <Avatar name={author} mine={true} />}

      {selected && (
        <div
          className={cn(
            "absolute -top-11 z-10",
            mine ? "right-12" : "left-12"
          )}
          role="dialog"
          aria-label="Actions message"
        >
          <div className="relative">
            <div className="rounded-xl border bg-white/95 backdrop-blur shadow-lg px-2 py-1.5 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={!isDeleted ? onReply : undefined}
                disabled={isDeleted}
                className={cn(
                  "px-2 py-1 rounded",
                  isDeleted
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-100 text-slate-800"
                )}
              >
                Répondre
              </button>
              <span className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={!isDeleted ? onEdit : undefined}
                disabled={!canEdit || isDeleted}
                className={cn(
                  "px-2 py-1 rounded",
                  !canEdit || isDeleted
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-100 text-slate-800"
                )}
              >
                Modifier
              </button>
              <span className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={onDelete}
                disabled={!canEdit || isDeleted}
                className={cn(
                  "px-2 py-1 rounded",
                  !canEdit || isDeleted
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-rose-50 text-rose-700"
                )}
              >
                Supprimer
              </button>
              <span className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={onCancel}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600"
              >
                Fermer
              </button>
              <span className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(text || "")}
                className="px-2 py-1 rounded hover:bg-slate-100"
              >
                Copier
              </button>
            </div>
            <div
              className={cn(
                "absolute -bottom-1 w-2 h-2 rotate-45 bg-white border-l border-b",
                mine ? "right-5" : "left-5"
              )}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentsStrip({ items, onRemove, progress }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-2 px-2 py-1 rounded-xl border bg-slate-50 text-[11px] sm:text-xs"
        >
          <span className="max-w-[16ch] truncate" title={a.name}>
            {a.name}
          </span>
          {progress?.[a.id] != null && (
            <span className="text-slate-500">
              {Math.round(progress[a.id])}%
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(a.id)}
            className="px-1 rounded hover:bg-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  isEditing,
  onCancel,
  onDelete,
  canDelete,
  replyPreview,
  onClearReply,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  uploadProgress,
}) {
  const fileRef = useRef(null);

  // Drag & Drop zone
  const dropRef = useRef(null);
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      prevent(e);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) onAddFiles(files);
    };
    ["dragenter", "dragover", "dragleave", "drop"].forEach((n) =>
      el.addEventListener(n, prevent)
    );
    el.addEventListener("drop", onDrop);
    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((n) =>
        el.removeEventListener(n, prevent)
      );
      el.removeEventListener("drop", onDrop);
    };
  }, [onAddFiles]);

  // Coller des images/fichiers
  useEffect(() => {
    const onPaste = (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) {
        e.preventDefault();
        onAddFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onAddFiles]);

  return (
    <div className="bg-transparent" ref={dropRef}>
      {replyPreview && (
        <div className="container mx-auto px-3 sm:px-4 py-2">
          <div className="mb-2 flex items-start gap-2 text-xs text-slate-700">
            <div className="rounded-xl border bg-white/80 backdrop-blur p-2 flex-1 shadow-sm">
              <div className="font-medium mb-0.5">
                Répondre à {replyPreview.author ?? `#${replyPreview.id}`}
              </div>
              <div className="opacity-80 line-clamp-2">
                {replyPreview.text ?? "…"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearReply}
              className="px-2 py-1 rounded-lg border hover:bg-white bg-white/80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 pb-3">
        <div className="relative">
          <div className="rounded-full border bg-white/80 backdrop-blur shadow-lg px-2 py-1.5 flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 rounded-full border hover:bg-slate-50 text-slate-700"
              title="Joindre des fichiers"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onAddFiles(files);
                e.target.value = "";
              }}
            />
            <textarea
              rows={1}
              value={value}
              placeholder={
                isEditing
                  ? "Modifier… (Ctrl+Entrée pour valider)"
                  : replyPreview
                  ? "Écrire une réponse…"
                  : "Écrire un message… (coller une capture ou glisser-déposer des fichiers)"
              }
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (isEditing && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSend();
                }
                if (!isEditing && e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
                if (e.key === "Escape") onCancel?.();
              }}
              className="flex-1 min-h-[38px] max-h-40 resize-y rounded-xl border border-transparent px-3 py-2 outline-none focus:ring-0 text-sm bg-transparent"
            />
            {isEditing ? (
              <div className="flex items-center gap-2 pr-1.5">
                {canDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-3 py-2 rounded-full border text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-2 rounded-full border hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onSend}
                  className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600"
                >
                  Valider
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSend}
                className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600"
                title="Envoyer"
              >
                ➤
              </button>
            )}
          </div>

          <AttachmentsStrip
            items={attachments}
            onRemove={onRemoveAttachment}
            progress={uploadProgress}
          />
          <div className="mt-1 ml-2 text-[11px] text-slate-500">
            Entrée pour envoyer · Maj+Entrée = retour à la ligne · Coller/Glisser pour
            joindre
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Composant principal ==================== */
export default function BMVTChatSimple() {
  const user = useAuthUser(); // { id, name, email, role }

  const [channels, setChannels] = useState([
    { id: "intra", label: "Agence ↔ Agence" },
    { id: "encadreurs", label: "Agence ↔ Encadreurs" },
  ]);
  const [active, setActive] = useState("intra");
  const [drafts, setDrafts] = useState({});
  const [attachmentsByChan, setAttachmentsByChan] = useState({});
  const [data, setData] = useState({ intra: [], encadreurs: [] });
  const [msgStatus, setMsgStatus] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [compact, setCompact] = useState(false);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [uploadProgress, setUploadProgress] = useState({}); // {attachmentId: 0..100}

  const pushToast = (t) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout = t.timeout ?? 4000;
    const item = { id, title: t.title, body: t.body, variant: t.variant || "info" };
    setToasts((arr) => [...arr, item]);
    if (timeout > 0)
      setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), timeout);
  };
  const closeToast = (id) =>
    setToasts((arr) => arr.filter((x) => x.id !== id));

  const current = useMemo(() => data[active] || [], [data, active]);
  const draft = drafts[active] ?? "";
  const attachments = attachmentsByChan[active] ?? [];
  const selectedMsg = current.find((m) => m.id === selectedId) || null;
  const isSelectedMine = selectedMsg?.author === (user?.name || "");
  const isEditing = editingId !== null;

  const viewportRef = useRef(null);
  const bottomRef = useRef(null);

  // Messages groupés avec séparateurs de jour
  const grouped = useMemo(() => {
    const arr = current
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const out = [];
    let lastDay = "";
    for (const m of arr) {
      const lbl = dayLabel(m.createdAt);
      if (lbl !== lastDay) {
        out.push({ _sep: true, id: `sep-${lbl}`, label: lbl });
        lastDay = lbl;
      }
      out.push(m);
    }
    return out;
  }, [current]);

  // Recherche locale
  const filtered = useMemo(() => {
    if (!query.trim()) return grouped;
    const q = query.trim().toLowerCase();
    return grouped.filter(
      (m) =>
        m._sep ||
        (m.text && m.text.toLowerCase().includes(q)) ||
        (m.author && m.author.toLowerCase().includes(q))
    );
  }, [grouped, query]);

  /* ---------- chargement canaux ---------- */
  useEffect(() => {
    (async () => {
      try {
        const j = await apiJson(`${API_CHAT}/channels`);
        const rawChannels = Array.isArray(j?.channels)
          ? j.channels
          : Array.isArray(j)
          ? j
          : [];
        if (rawChannels.length) {
          const mapped = rawChannels.map((id) => ({
            id,
            label:
              id === "intra"
                ? "Agence ↔ Agence"
                : id === "encadreurs"
                ? "Agence ↔ Encadreurs"
                : id,
          }));
          setChannels(mapped);
          if (!mapped.find((c) => c.id === active))
            setActive(mapped[0]?.id || "intra");
        }
      } catch {}
    })();
  }, []); // une fois

  /* ---------- auto-sélection encadreurs selon rôle ---------- */
  useEffect(() => {
    if (!user?.role) return;
    if (
      user.role.toLowerCase().includes("encadreur") &&
      active !== "encadreurs"
    )
      setActive("encadreurs");
  }, [user, active]);

  /* ---------- load initial canal ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const j = await apiJson(
          `${API_CHAT}/messages?channel=${encodeURIComponent(active)}&limit=100`
        );
        if (cancelled) return;
        const rawItems = Array.isArray(j?.items)
          ? j.items
          : Array.isArray(j)
          ? j
          : [];
        const items = rawItems.map(rowToMessage).filter(Boolean);
        setData((d) => ({ ...d, [active]: items }));
        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({
            behavior: "instant",
            block: "end",
          })
        );
      } catch (e) {
        if (!cancelled) setError(e.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  /* ---------- polling léger ---------- */
  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const list = data[active] || [];
        const lastId = list.length ? Number(list[list.length - 1].id) || 0 : 0;
        const url = `${API_CHAT}/messages?channel=${encodeURIComponent(
          active
        )}&afterId=${lastId}`;
        const j = await apiJson(url);
        const rawNew = Array.isArray(j?.items)
          ? j.items
          : Array.isArray(j)
          ? j
          : [];
        if (rawNew.length) {
          const newer = rawNew.map(rowToMessage).filter(Boolean);

          const thereIsIncomingFromOther = newer.some(
            (m) => m && m.author !== (user?.name || "")
          );
          if (thereIsIncomingFromOther) {
            setMsgStatus((st) => {
              const copy = { ...st };
              (data[active] || []).forEach((m) => {
                if (
                  m.author === (user?.name || "") &&
                  !m.deletedAt &&
                  (copy[m.id] === "sent" || copy[m.id] === "delivered")
                ) {
                  copy[m.id] = "read";
                }
              });
              return copy;
            });
          }

          newer.forEach((m) => {
            if (m && m.author === (user?.name || "")) {
              setMsgStatus((st) => ({
                ...st,
                [m.id]: st[m.id] === "read" ? "read" : "delivered",
              }));
            }
          });

          setData((d) => {
            const currentList = d[active] || [];
            const currentIds = new Set(currentList.map((x) => x.id));
            const toAdd = newer.filter((x) => x && !currentIds.has(x.id));
            return { ...d, [active]: [...currentList, ...toAdd] };
          });

          // gestion badge nouveaux messages
          if (!atBottom) setUnread((n) => n + newer.length);
          else
            requestAnimationFrame(() =>
              bottomRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              })
            );
        }
      } catch {}
    }, 5000);
    return () => clearInterval(int);
  }, [active, data, user?.name, atBottom]);

  /* ---------- SSE temps réel ---------- */
  useEffect(() => {
    let es;
    try {
      es = new EventSource(
        `${API_CHAT}/stream?channel=${encodeURIComponent(active)}`,
        { withCredentials: true }
      );
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data || "{}");
          if (payload?.type === "message:new" && payload.item) {
            const msg = rowToMessage(payload.item);
            if (!msg) return;
            setData((d) => {
              const list = d[active] || [];
              if (list.some((m) => m.id === msg.id)) return d; // dédup
              return { ...d, [active]: [...list, msg] };
            });
            if (msg.author === (user?.name || "")) {
              setMsgStatus((st) => ({
                ...st,
                [msg.id]: st[msg.id] === "read" ? "read" : "delivered",
              }));
            }
            if (!atBottom) setUnread((n) => n + 1);
            else
              requestAnimationFrame(() =>
                bottomRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                })
              );
          }
          if (payload?.type === "message:update" && payload.item) {
            const msg = rowToMessage(payload.item);
            if (!msg) return;
            setData((d) => ({
              ...d,
              [active]: (d[active] || []).map((m) =>
                m.id === msg.id ? msg : m
              ),
            }));
          }
          if (payload?.type === "message:delete" && payload.id) {
            setData((d) => ({
              ...d,
              [active]: (d[active] || []).map((m) =>
                m.id === payload.id
                  ? {
                      ...m,
                      deletedAt: new Date().toISOString(),
                      attachments: [],
                    }
                  : m
              ),
            }));
          }
        } catch {}
      };
      es.onerror = () => {
        try {
          es.close();
        } catch {}
      };
    } catch {}
    return () => {
      try {
        es?.close();
      } catch {}
    };
  }, [active, user?.name, atBottom]);

  /* ---------- observe scroll pour badge ---------- */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      setAtBottom(nearBottom);
      if (nearBottom) setUnread(0);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- clavier global + aide ---------- */
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setEditingId(null);
        setSelectedId(null);
        setReplyTo(null);
        setHelpOpen(false);
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedMsg &&
        isSelectedMine &&
        !isEditing
      ) {
        e.preventDefault();
        handleDelete(selectedMsg.id);
      }
      if (e.key === "?") {
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedMsg, isSelectedMine, isEditing]);

  /* ---------- pièces jointes ---------- */
  const addFiles = (files) => {
    if (!files?.length) return;
    const mapped = files.map((f) => {
      const url = URL.createObjectURL(f);
      const type = f.type?.startsWith("image/")
        ? "image"
        : f.type?.startsWith("video/")
        ? "video"
        : "file";
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        type,
        url,
        file: f,
      };
    });
    setAttachmentsByChan((s) => ({
      ...s,
      [active]: [...(s[active] || []), ...mapped],
    }));
  };
  const removeAttachment = (id) => {
    setAttachmentsByChan((s) => ({
      ...s,
      [active]: (s[active] || []).filter((a) => a.id !== id),
    }));
    setUploadProgress((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });
  };

  /* ---------- export JSON ---------- */
  const handleExport = () => {
    try {
      const payload = (data[active] || []).map((m) => ({
        id: m.id,
        author: m.author,
        text: m.text,
        createdAt: m.createdAt,
        replyToId: m.replyToId,
        attachments: m.attachments,
      }));
      const blob = new Blob(
        [JSON.stringify({ channel: active, items: payload }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${active}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      pushToast({ title: "Export JSON prêt", variant: "success" });
    } catch (e) {
      pushToast({
        title: "Export échoué",
        body: String(e),
        variant: "error",
      });
    }
  };

  /* ---------- actions messages ---------- */
  // Envoi avec progression si fichiers (XHR)
  const sendWithProgress = async (fd) => {
    const token = getToken();
    const url = `${API_CHAT}/messages`;
    const xhr = new XMLHttpRequest();
    const progressByFile = {}; // attId -> %
    const attIds = attachments.map((a) => a.id);
    const totalSize = attachments.reduce(
      (s, a) => s + (a.file?.size || 0),
      0
    );
    return new Promise((resolve, reject) => {
      xhr.open("POST", url, true);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({});
            }
          } else reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      if (xhr.upload && totalSize > 0) {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = (e.loaded / e.total) * 100;
          // répartir la progression globale sur toutes les pièces
          attIds.forEach((id) => (progressByFile[id] = pct));
          setUploadProgress({ ...progressByFile });
        };
      }
      xhr.onerror = () => reject(new Error("Erreur réseau"));
      xhr.send(fd);
    });
  };

  const handleSend = async () => {
    const text = (draft || "").trim();
    const files = attachments.map((a) => a.file).filter(Boolean);
    const hasFiles = files.length > 0;
    if (!text && !hasFiles) return;

    try {
      if (editingId) {
        const body = text ? { text } : { text: "" };
        const j = await apiJson(`${API_CHAT}/messages/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        const updated = rowToMessage(j.item);
        if (updated) {
          setData((d) => ({
            ...d,
            [active]: (d[active] || []).map((m) =>
              m.id === editingId ? updated : m
            ),
          }));
          setMsgStatus((st) => ({
            ...st,
            [updated.id]: st[updated.id] || "sent",
          }));
          pushToast({ title: "Message modifié", variant: "info" });
        }
        setEditingId(null);
        setSelectedId(null);
      } else {
        const tempId = genTempId();
        const tempMessage = {
          id: tempId,
          channel: active,
          authorId: user?.id ?? undefined,
          author: user?.name || "Utilisateur",
          text,
          replyToId: replyTo?.id ?? undefined,
          attachments: (attachments || []).map((a, idx) => ({
            id: a.id || `${tempId}-att-${idx}`,
            name: a.name,
            type: a.type,
            url: a.url,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setData((d) => ({
          ...d,
          [active]: [...(d[active] || []), tempMessage],
        }));
        setMsgStatus((st) => ({ ...st, [tempId]: "sending" }));
        let result;
        try {
          if (!hasFiles) {
            result = await apiJson(`${API_CHAT}/messages`, {
              method: "POST",
              body: JSON.stringify({
                channel: active,
                authorName: user?.name || "Utilisateur",
                authorId: user?.id ?? undefined,
                text,
                replyToId: replyTo?.id ?? undefined,
              }),
            });
          } else {
            const fd = new FormData();
            fd.append("channel", active);
            fd.append("authorName", user?.name || "Utilisateur");
            if (user?.id) fd.append("authorId", String(user.id));
            if (text) fd.append("text", text);
            if (replyTo?.id) fd.append("replyToId", String(replyTo.id));
            files.forEach((f) => fd.append("files", f));
            result = await sendWithProgress(fd);
          }
          const created = rowToMessage(result?.item);
          if (created) {
            setData((d) => {
              const list = d[active] || [];
              let next = list.filter((m) => m.id !== tempId);
              const already = next.some((m) => m.id === created.id);
              if (!already) next = [...next, created];
              return { ...d, [active]: next };
            });
            setMsgStatus((st) => {
              const { [tempId]: _ignore, ...rest } = st;
              return { ...rest, [created.id]: "sent" };
            });
            pushToast({ title: "Message envoyé", variant: "success" });
          }
        } catch (err) {
          setData((d) => ({
            ...d,
            [active]: (d[active] || []).filter((m) => m.id !== tempId),
          }));
          setMsgStatus((st) => {
            const { [tempId]: _i, ...rest } = st;
            return rest;
          });
          pushToast({
            title: "Échec de l'envoi",
            body: err.message,
            variant: "error",
          });
          throw err;
        } finally {
          setUploadProgress({});
        }
      }
      setDrafts((dr) => ({ ...dr, [active]: "" }));
      setReplyTo(null);
      setAttachmentsByChan((s) => ({ ...s, [active]: [] }));
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      );
    } catch (e) {
      pushToast({
        title: "Échec de l'envoi",
        body: e.message,
        variant: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiJson(`${API_CHAT}/messages/${id}`, { method: "DELETE" });
      setData((d) => ({
        ...d,
        [active]: (d[active] || []).map((m) =>
          m.id === id
            ? { ...m, deletedAt: new Date().toISOString(), attachments: [] }
            : m
        ),
      }));
      setSelectedId(null);
      setEditingId(null);
      setReplyTo(null);
      pushToast({ title: "Message supprimé", variant: "warning" });
    } catch (e) {
      pushToast({
        title: "Échec de la suppression",
        body: e.message,
        variant: "error",
      });
    }
  };

  const handleStartEdit = (msg) => {
    if (!msg || msg.author !== (user?.name || "")) return;
    if (msg.deletedAt) return;
    setDrafts((dr) => ({ ...dr, [active]: msg.text }));
    setEditingId(msg.id);
    setReplyTo(null);
  };

  const handleStartReply = (msg) => {
    setReplyTo({ id: msg.id, author: msg.author, text: msg.text });
    setSelectedId(msg.id);
    setEditingId(null);
  };

  const openHelp = () => setHelpOpen(true);

  /* ---------- rendu ---------- */
  return (
    <div className="min-h-dvh w-full text-slate-900 flex flex-col pb-[env(safe-area-inset-bottom)] bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.08),transparent_45%)]">
      <Header
        user={user}
        onExport={handleExport}
        compact={compact}
        setCompact={setCompact}
        query={query}
        setQuery={setQuery}
        onHelp={openHelp}
      />
      <Tabs
        channels={channels}
        active={active}
        onChange={(id) => {
          setActive(id);
          setUnread(0);
        }}
      />

      <div className="border-b bg-white/70 backdrop-blur text-sm">
        <div className="container mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {selectedMsg ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-700 hidden xs:inline">
                Message sélectionné :
              </span>
              <span className="px-2 py-0.5 rounded bg-white border text-slate-700 max-w-[50ch] truncate">
                {selectedMsg.text ||
                  (selectedMsg.attachments?.[0]?.name ?? "(Pièce jointe)")}
              </span>
            </div>
          ) : (
            <span className="text-slate-600 truncate">
              Astuce : double-clic pour répondre · clic pour les actions.
            </span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setReplyTo(null);
                setEditingId(null);
              }}
              className="px-2.5 py-1.5 rounded-lg border hover:bg-white text-xs bg-white"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 grid grid-rows-[1fr_auto]">
        <div className="flex-1 overflow-auto" ref={viewportRef}>
          <div
            className={cn(
              "container mx-auto",
              compact ? "p-2 space-y-1.5" : "p-2 sm:p-4 space-y-3"
            )}
          >
            {loading && (
              <div className="text-xs text-slate-500">Chargement…</div>
            )}
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                {error}
              </div>
            )}

            {filtered.map((m) =>
              m._sep ? (
                <DaySeparator key={m.id} label={m.label} />
              ) : (
                <Message
                  key={m.id}
                  mine={m.author === (user?.name || "")}
                  selected={m.id === selectedId}
                  author={m.author}
                  text={m.text}
                  time={m.time}
                  replyTo={(() => {
                    // simple résolution locale
                    const ref = (data[active] || []).find(
                      (x) => x.id === m.replyToId
                    );
                    return ref
                      ? { id: ref.id, author: ref.author, text: ref.text }
                      : m.replyTo;
                  })()}
                  attachments={m.attachments}
                  editedAt={m.editedAt}
                  deletedAt={m.deletedAt}
                  status={msgStatus[m.id]}
                  onClick={() => setSelectedId(m.id)}
                  onDoubleClick={() => handleStartReply(m)}
                  onReply={() => handleStartReply(m)}
                  canEdit={m.author === (user?.name || "") && !m.deletedAt}
                  onEdit={() => handleStartEdit(m)}
                  onDelete={() =>
                    m.author === (user?.name || "") && handleDelete(m.id)
                  }
                  onCancel={() => setSelectedId(null)}
                  onOpenAttachment={(a) => setPreviewItem(a)}
                  compact={compact}
                  query={query}
                />
              )
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* badge nouveaux messages + bouton descendre */}
        {!atBottom && unread > 0 && (
          <div className="pointer-events-none absolute bottom-24 left-0 right-0 flex justify-center">
            <button
              onClick={() => {
                bottomRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                });
              }}
              className="pointer-events-auto px-3 py-1.5 rounded-full bg-indigo-600 text-white shadow-lg border border-indigo-700"
            >
              {unread} nouveau{xPlural(unread)} – Aller en bas
            </button>
          </div>
        )}

        <div className="border-t bg-transparent">
          <Composer
            value={draft}
            onChange={(v) =>
              setDrafts((d) => ({ ...d, [active]: v }))
            }
            onSend={handleSend}
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null);
              setSelectedId(null);
              setReplyTo(null);
              setDrafts((d) => ({ ...d, [active]: "" }));
            }}
            onDelete={() =>
              selectedMsg &&
              selectedMsg.author === (user?.name || "") &&
              handleDelete(selectedMsg.id)
            }
            canDelete={!!(
              selectedMsg && selectedMsg.author === (user?.name || "")
            )}
            replyPreview={replyTo}
            onClearReply={() => setReplyTo(null)}
            attachments={attachments}
            onAddFiles={addFiles}
            onRemoveAttachment={removeAttachment}
            uploadProgress={uploadProgress}
          />
        </div>
      </main>

      <footer className="p-3 text-[11px] sm:text-xs text-slate-500 border-t bg-white/60 backdrop-blur text-center">
        © {new Date().getFullYear()} BMVT · Chat
      </footer>

      <Lightbox item={previewItem} onClose={() => setPreviewItem(null)} />
      <Toasts items={toasts} onClose={closeToast} />

      {/* Aide / raccourcis */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">
                Raccourcis & Astuces
              </h2>
              <button
                className="px-2 py-1 rounded hover:bg-slate-100"
                onClick={() => setHelpOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className="text-sm space-y-1.5 text-slate-700">
              <li>
                <b>Entrée</b> : envoyer · <b>Maj+Entrée</b> : retour à la
                ligne
              </li>
              <li>
                <b>Ctrl / ⌘+Entrée</b> : valider une édition
              </li>
              <li>
                <b>Échap</b> : annuler sélection/édition
              </li>
              <li>
                <b>?</b> : ouvrir/fermer cette aide
              </li>
              <li>Glisser-déposer / coller pour joindre des fichiers</li>
              <li>Barre de recherche pour filtrer et surligner</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  function xPlural(n) {
    return n > 1 ? "x" : "";
  }
}
