import React, { useEffect, useMemo, useRef, useState } from "react";
import useAuthUser from "../../hooks/useAuthUser"; // { id, name, email, role }

/**
 * BMVTChatSimple.jsx — front relié au back fourni
 * - SSE temps réel (si /api/chat/stream existe)
 * - Polling léger (5s) + déduplication
 * - UI optimiste + statuts (sending/sent/delivered/read)
 * - Toasts (notifications) intégrés
 */

/* ======================== helpers API ======================== */
// Même logique que RecherchePaiement.jsx
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

// Namespace de l'API Chat
const API_CHAT = `${API_BASE}/api/chat`;

// Auth (token localStorage)
const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

// Normalise une URL potentiellement relative (ex: /uploads/chat/..)
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
    const msg = typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
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

// ID temporaire pour UI optimiste
function genTempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ===================== Toasts (notifications) ==================== */
function Toasts({ items, onClose }) {
  if (!items?.length) return null;
  return (
    <div
      className="fixed bottom-3 right-3 z-[60] flex flex-col gap-2 w-80 max-w-[92vw]"
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl shadow-lg border p-3 bg-white ${
            t.variant === "error"
              ? "border-rose-200"
              : t.variant === "warning"
              ? "border-amber-200"
              : t.variant === "success"
              ? "border-emerald-200"
              : "border-gray-200"
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              className={`mt-0.5 w-2 h-2 rounded-full ${
                t.variant === "error"
                  ? "bg-rose-500"
                  : t.variant === "warning"
                  ? "bg-amber-500"
                  : t.variant === "success"
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t.title}</div>
              {t.body ? <div className="text-xs text-gray-600 break-words mt-0.5">{t.body}</div> : null}
            </div>
            <button
              onClick={() => onClose(t.id)}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====================== Composants UI ======================== */
function Header({ user }) {
  return (
    <header className="sticky top-0 z-40 p-3 sm:p-4 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">BMVT · Chat</h1>
          <p className="text-[11px] sm:text-xs text-gray-600">Canaux simples : Agence et Agence–Encadreurs</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {user ? (
            <span className="px-2 py-1 rounded-lg border bg-gray-50">
              Connecté : <span className="font-medium">{user.name}</span>
              {user.role ? <span className="text-gray-500"> · {user.role}</span> : null}
            </span>
          ) : (
            <span className="px-2 py-1 rounded-lg border bg-amber-50 text-amber-800">Non connecté</span>
          )}
        </div>
      </div>
    </header>
  );
}

function Tabs({ channels, active, onChange }) {
  return (
    <div className="sticky top-[52px] sm:top-[64px] z-30 border-b bg-gray-50/90 backdrop-blur">
      <div className="container mx-auto flex gap-2 p-2">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition ${
              active === c.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-100"
            }`}
          >
            {c.label}
          </button>
        ))}
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
            className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs sm:text-sm"
          >
            Fermer
          </button>
        </div>
        <div className="bg-white rounded-xl p-2">
          {item.type === "image" ? (
            <img src={item.url} alt={item.name} className="w-full max-h-[75svh] object-contain rounded-lg" />
          ) : item.type === "video" ? (
            <video src={item.url} className="w-full max-h-[75svh] rounded-lg" controls autoPlay />
          ) : (
            <div className="p-6 text-center text-sm">
              <p className="mb-3">Prévisualisation indisponible pour ce type de fichier.</p>
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
          className="rounded-lg border bg-white p-1 overflow-hidden"
        >
          {a.type === "image" ? (
            <button type="button" onClick={() => onOpen(a)} className="block w-full">
              <img src={a.url} alt={a.name} className="w-full h-28 sm:h-32 md:h-40 object-cover rounded" />
            </button>
          ) : a.type === "video" ? (
            <button type="button" onClick={() => onOpen(a)} className="block w-full">
              <video src={a.url} className="w-full h-28 sm:h-32 md:h-40 object-cover rounded" muted />
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
  status, // 'sending' | 'sent' | 'delivered' | 'read'
  onClick,
  onDoubleClick,
  canEdit,
  onReply,
  onEdit,
  onDelete,
  onCancel,
  onOpenAttachment,
}) {
  const isDeleted = !!deletedAt;
  const isEdited = !!editedAt;
  const ticks = (() => {
    if (!mine || deletedAt) return null;
    if (status === "sending") return <span className="ml-1 text-[10px] opacity-70">⏳</span>;
    if (status === "sent") return <span className="ml-1 text-[10px]">✓</span>;
    if (status === "delivered") return <span className="ml-1 text-[10px]">✓✓</span>;
    if (status === "read") return <span className="ml-1 text-[10px] text-cyan-400">✓✓</span>;
    return null;
  })();
  return (
    <div className={`relative flex ${mine ? "justify-end" : "justify-start"}`}>
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={!isDeleted ? onDoubleClick : undefined}
        className={`text-left max-w-[90%] sm:max-w-[75%] md:max-w-[66%] lg:max-w-[55%] rounded-2xl px-3 py-2 border shadow-sm outline-none transition ${
          mine ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"
        } ${selected ? (mine ? "ring-2 ring-white/70" : "ring-2 ring-indigo-300") : "ring-0"} ${
          isDeleted ? "opacity-70" : ""
        }`}
        disabled={isDeleted}
      >
        <div className="text-[10px] sm:text-[11px] opacity-80 mb-1 flex items-center gap-2 flex-wrap">
          <span>
            {author} · {time}
          </span>
          {isEdited && !isDeleted && (
            <span className="px-1.5 py-0.5 rounded bg-white/20 border border-white/30 text-[10px]">
              modifié
            </span>
          )}
          {isDeleted && (
            <span
              className={`px-1.5 py-0.5 rounded border text-[10px] ${
                mine ? "bg-white/15 border-white/30" : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              supprimé
            </span>
          )}
        </div>
        {replyTo && !isDeleted && (
          <div
            className={`mb-1 text-[10px] sm:text-[11px] rounded-md px-2 py-1 ${
              mine ? "bg-white/15" : "bg-gray-50"
            } border ${mine ? "border-white/30" : "border-gray-200"}`}
          >
            <span className="font-medium">Réponse à {replyTo.author ?? `#${replyTo.id}`} :</span>{" "}
            {replyTo.text ? (replyTo.text.length > 120 ? replyTo.text.slice(0, 120) + "…" : replyTo.text) : "…"}
          </div>
        )}
        {isDeleted ? (
          <div className="text-sm italic opacity-80">Message supprimé</div>
        ) : (
          <>
            {text && <div className="text-sm leading-5 whitespace-pre-wrap">{text}</div>}
            {mine && !isDeleted && (
              <div className={`mt-1 text-[10px] ${mine ? "opacity-80" : "opacity-60"}`}>
                Statut : {status || "sent"} {ticks}
              </div>
            )}
            {attachments.length ? (
              <AttachmentsPreview items={attachments} onOpen={onOpenAttachment} />
            ) : null}
          </>
        )}
      </button>

      {selected && (
        <div
          className={`absolute -top-10 ${mine ? "right-2" : "left-2"} z-10`}
          role="dialog"
          aria-label="Actions message"
        >
          <div className="relative">
            <div className="rounded-xl border bg-white shadow-lg px-2 py-1.5 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={!isDeleted ? onReply : undefined}
                disabled={isDeleted}
                className={`px-2 py-1 rounded ${
                  isDeleted ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                Répondre
              </button>
              <span className="h-4 w-px bg-gray-200" />
              <button
                type="button"
                onClick={!isDeleted ? onEdit : undefined}
                disabled={!canEdit || isDeleted}
                className={`px-2 py-1 rounded ${
                  !canEdit || isDeleted ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                Modifier
              </button>
              <span className="h-4 w-px bg-gray-200" />
              <button
                type="button"
                onClick={onDelete}
                disabled={!canEdit || isDeleted}
                className={`px-2 py-1 rounded ${
                  !canEdit || isDeleted ? "opacity-40 cursor-not-allowed" : "hover:bg-rose-50 text-rose-700"
                }`}
              >
                Supprimer
              </button>
              <span className="h-4 w-px bg-gray-200" />
              <button type="button" onClick={onCancel} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600">
                Fermer
              </button>
            </div>
            <div
              className={`absolute -bottom-1 ${mine ? "right-5" : "left-5"} w-2 h-2 rotate-45 bg-white border-l border-b`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentsStrip({ items, onRemove }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-2 px-2 py-1 rounded-lg border bg-gray-50 text-[11px] sm:text-xs"
        >
          <span className="max-w-[16ch] truncate" title={a.name}>
            {a.name}
          </span>
          <button type="button" onClick={() => onRemove(a.id)} className="px-1 rounded hover:bg-white">
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
}) {
  const fileRef = useRef(null);
  return (
    <div className="border-t bg-white p-2 sm:p-3">
      {replyPreview && (
        <div className="mb-2 flex items-start gap-2 text-xs text-gray-700">
          <div className="rounded-md border bg-gray-50 p-2 flex-1">
            <div className="font-medium mb-0.5">Répondre à {replyPreview.author ?? `#${replyPreview.id}`}</div>
            <div className="opacity-80 line-clamp-2">{replyPreview.text ?? "…"}</div>
          </div>
          <button type="button" onClick={onClearReply} className="px-2 py-1 rounded border hover:bg-gray-50">
            ×
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
          title="Joindre des fichiers"
        >
          Joindre
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
            e.target.value = ""; // reselect same files later
          }}
        />
        <textarea
          rows={1}
          value={value}
          placeholder={
            isEditing
              ? "Modifier le message… (Ctrl+Entrée pour valider)"
              : replyPreview
              ? "Écrire une réponse…"
              : "Écrire un message…"
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
          className="flex-1 min-h-[38px] max-h-40 resize-y rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
        />
        {isEditing ? (
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-2 rounded-xl border text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Supprimer
              </button>
            )}
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded-xl border hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="button"
              onClick={onSend}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600"
            >
              Valider
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSend}
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600"
          >
            Envoyer
          </button>
        )}
      </div>

      <AttachmentsStrip items={attachments} onRemove={onRemoveAttachment} />
      <div className="mt-1 text-[11px] text-gray-500">
        {isEditing
          ? "Edition en cours… Échap pour annuler."
          : "Astuce : Entrée pour envoyer · Maj+Entrée = retour à la ligne."}
      </div>
    </div>
  );
}

/* ===================== Composant principal ==================== */
export default function BMVTChatSimple() {
  const user = useAuthUser(); // { id, name, email, role }

  // canaux issus du back
  const [channels, setChannels] = useState([
    { id: "intra", label: "Agence ↔ Agence" },
    { id: "encadreurs", label: "Agence ↔ Encadreurs" },
  ]);

  const [active, setActive] = useState("intra");
  const [drafts, setDrafts] = useState({});
  const [attachmentsByChan, setAttachmentsByChan] = useState({});

  // data par canal: { [channel]: Message[] }
  const [data, setData] = useState({ intra: [], encadreurs: [] });

  // suivi des statuts par id
  const [msgStatus, setMsgStatus] = useState({}); // { [id]: 'sending'|'sent'|'delivered'|'read' }

  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // notifications (toasts)
  const [toasts, setToasts] = useState([]);
  const pushToast = (t) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout = t.timeout ?? 4000;
    const item = { id, title: t.title, body: t.body, variant: t.variant || "info" };
    setToasts((arr) => [...arr, item]);
    if (timeout > 0) {
      setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), timeout);
    }
  };
  const closeToast = (id) => setToasts((arr) => arr.filter((x) => x.id !== id));

  const current = useMemo(() => data[active] || [], [data, active]);
  const draft = drafts[active] ?? "";
  const attachments = attachmentsByChan[active] ?? [];
  const selectedMsg = current.find((m) => m.id === selectedId) || null;
  const isSelectedMine = selectedMsg?.author === (user?.name || "");
  const isEditing = editingId !== null;

  // Résolution replyTo pour l'affichage
  const withResolvedReplies = useMemo(() => {
    const byId = new Map(current.map((m) => [m.id, m]));
    return current.map((m) => {
      if (!m.replyToId) return m;
      const ref = byId.get(m.replyToId);
      return { ...m, replyTo: ref ? { id: ref.id, author: ref.author, text: ref.text } : { id: m.replyToId } };
    });
  }, [current]);

  /* ---------- chargement canaux ---------- */
  useEffect(() => {
    (async () => {
      try {
        const j = await apiJson(`${API_CHAT}/channels`);
        if (Array.isArray(j.channels)) {
          const mapped = j.channels.map((id) => ({
            id,
            label: id === "intra" ? "Agence ↔ Agence" : id === "encadreurs" ? "Agence ↔ Encadreurs" : id,
          }));
          setChannels(mapped);
          if (!mapped.find((c) => c.id === active)) setActive(mapped[0]?.id || "intra");
        }
      } catch {
        // silencieux: fallback sur valeurs par défaut
      }
    })();
  }, []); // une fois

  /* ---------- auto-sélection canal encadreur si rôle ---------- */
  useEffect(() => {
    if (!user?.role) return;
    if (user.role.toLowerCase().includes("encadreur") && active !== "encadreurs") setActive("encadreurs");
  }, [user, active]);

  /* ---------- charger historique initial du canal actif ---------- */
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
        const items = (j.items || []).map(rowToMessage).filter(Boolean);
        setData((d) => ({ ...d, [active]: items }));
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

  /* ---------- polling léger via afterId ---------- */
  useEffect(() => {
    const int = setInterval(async () => {
      try {
        const list = data[active] || [];
        const lastId = list.length ? list[list.length - 1].id : 0;
        const url = `${API_CHAT}/messages?channel=${encodeURIComponent(active)}&afterId=${lastId}`;
        const j = await apiJson(url);
        if (j?.items?.length) {
          const newer = (j.items || []).map(rowToMessage).filter(Boolean);

          // incoming d'un autre auteur => marquer nos anciens en "read"
          const thereIsIncomingFromOther = newer.some((m) => m && m.author !== (user?.name || ""));
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

          // si on reçoit nos propres messages via polling, marquer 'delivered'
          newer.forEach((m) => {
            if (m && m.author === (user?.name || "")) {
              setMsgStatus((st) => ({ ...st, [m.id]: st[m.id] === "read" ? "read" : "delivered" }));
            }
          });

          // déduplication
          setData((d) => {
            const currentList = d[active] || [];
            const currentIds = new Set(currentList.map((x) => x.id));
            const toAdd = newer.filter((x) => x && !currentIds.has(x.id));
            return { ...d, [active]: [...currentList, ...toAdd] };
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(int);
  }, [active, data]);

  /* ---------- SSE temps réel (abonnement canal actif) ---------- */
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
          }
          if (payload?.type === "message:update" && payload.item) {
            const msg = rowToMessage(payload.item);
            if (!msg) return;
            setData((d) => ({
              ...d,
              [active]: (d[active] || []).map((m) => (m.id === msg.id ? msg : m)),
            }));
          }
          if (payload?.type === "message:delete" && payload.id) {
            setData((d) => ({
              ...d,
              [active]: (d[active] || []).map((m) =>
                m.id === payload.id
                  ? { ...m, deletedAt: new Date().toISOString(), attachments: [] }
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
  }, [active, user?.name]);

  /* ---------- gestion clavier global ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setEditingId(null);
        setSelectedId(null);
        setReplyTo(null);
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedMsg, isSelectedMine, isEditing]);

  /* ---------- pièces jointes: fichiers locaux + preview ---------- */
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
    setAttachmentsByChan((s) => ({ ...s, [active]: [...(s[active] || []), ...mapped] }));
  };

  const removeAttachment = (id) => {
    setAttachmentsByChan((s) => ({
      ...s,
      [active]: (s[active] || []).filter((a) => a.id !== id),
    }));
  };

  /* ---------- actions messages ---------- */
  const handleSend = async () => {
    const text = (draft || "").trim();
    const files = attachments.map((a) => a.file).filter(Boolean);
    const hasFiles = files.length > 0;
    if (!text && !hasFiles) return;

    try {
      if (editingId) {
        // Edition (texte uniquement ici)
        const body = text ? { text } : { text: "" };
        const j = await apiJson(`${API_CHAT}/messages/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        const updated = rowToMessage(j.item);
        if (updated) {
          setData((d) => ({
            ...d,
            [active]: (d[active] || []).map((m) => (m.id === editingId ? updated : m)),
          }));
          setMsgStatus((st) => ({ ...st, [updated.id]: st[updated.id] || "sent" }));
          pushToast({ title: "Message modifié", variant: "info" });
        }
        setEditingId(null);
        setSelectedId(null);
      } else {
        // --- UI OPTIMISTE : message local immédiat ---
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
            url: a.url, // preview locale (blob:)
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setData((d) => ({ ...d, [active]: [...(d[active] || []), tempMessage] }));
        setMsgStatus((st) => ({ ...st, [tempId]: "sending" })); // ⏳

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
            result = await apiJson(`${API_CHAT}/messages`, { method: "POST", body: fd });
          }
          const created = rowToMessage(result?.item);
          if (created) {
            // Remplacer le message temporaire par le message serveur
            setData((d) => ({
              ...d,
              [active]: (d[active] || []).map((m) => (m.id === tempId ? created : m)),
            }));
            setMsgStatus((st) => ({ ...st, [created.id]: "sent", [tempId]: undefined })); // ✓
            pushToast({ title: "Message envoyé", variant: "success" });
          }
        } catch (err) {
          // rollback optimiste
          setData((d) => ({
            ...d,
            [active]: (d[active] || []).filter((m) => m.id !== tempId),
          }));
          setMsgStatus((st) => ({ ...st, [tempId]: undefined }));
          pushToast({ title: "Échec de l'envoi", body: err.message, variant: "error" });
          throw err;
        }
      }

      // reset
      setDrafts((dr) => ({ ...dr, [active]: "" }));
      setReplyTo(null);
      setAttachmentsByChan((s) => ({ ...s, [active]: [] }));
    } catch (e) {
      pushToast({ title: "Échec de l'envoi", body: e.message, variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiJson(`${API_CHAT}/messages/${id}`, { method: "DELETE" });
      // marquer supprimé côté client
      setData((d) => ({
        ...d,
        [active]: (d[active] || []).map((m) =>
          m.id === id ? { ...m, deletedAt: new Date().toISOString(), attachments: [] } : m
        ),
      }));
      setSelectedId(null);
      setEditingId(null);
      setReplyTo(null);
      pushToast({ title: "Message supprimé", variant: "warning" });
    } catch (e) {
      pushToast({ title: "Échec de la suppression", body: e.message, variant: "error" });
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

  /* ---------- rendu ---------- */
  return (
    <div className="supports-[height:100svh]:min-h-[100svh] min-h-dvh w-full bg-white text-gray-900 flex flex-col pb-[env(safe-area-inset-bottom)]">
      <Header user={user} />
      <Tabs channels={channels} active={active} onChange={setActive} />

      <div className="border-b bg-gray-50 text-sm">
        <div className="container mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {selectedMsg ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-700 hidden xs:inline">Message sélectionné :</span>
              <span className="px-2 py-0.5 rounded bg-white border text-gray-700 max-w-[50ch] truncate">
             {selectedMsg.text || (selectedMsg.attachments?.[0]?.name ?? "(Pièce jointe)")}

              </span>
            </div>
          ) : (
            <span className="text-gray-600 truncate">
              Astuce : double-clique pour répondre, ou clique pour ouvrir les actions.
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
              className="px-2.5 py-1.5 rounded-lg border hover:bg-white text-xs"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 grid grid-rows-[1fr_auto]">
        <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto p-2 sm:p-3 md:p-4 space-y-2">
            {loading && <div className="text-xs text-gray-500">Chargement…</div>}
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">{error}</div>
            )}
            {withResolvedReplies.map((m) => (
              <Message
                key={m.id}
                mine={m.author === (user?.name || "")}
                selected={m.id === selectedId}
                author={m.author}
                text={m.text}
                time={m.time}
                replyTo={m.replyTo}
                attachments={m.attachments}
                editedAt={m.editedAt}
                deletedAt={m.deletedAt}
                status={msgStatus[m.id]}
                onClick={() => setSelectedId(m.id)}
                onDoubleClick={() => handleStartReply(m)}
                onReply={() => handleStartReply(m)}
                canEdit={m.author === (user?.name || "") && !m.deletedAt}
                onEdit={() => handleStartEdit(m)}
                onDelete={() => m.author === (user?.name || "") && handleDelete(m.id)}
                onCancel={() => setSelectedId(null)}
                onOpenAttachment={(a) => setPreviewItem(a)}
              />
            ))}
          </div>
        </div>
        <div className="border-t">
          <div className="container mx-auto">
            <Composer
              value={draft}
              onChange={(v) => setDrafts((d) => ({ ...d, [active]: v }))}
              onSend={handleSend}
              isEditing={!!editingId}
              onCancel={() => {
                setEditingId(null);
                setSelectedId(null);
                setReplyTo(null);
                setDrafts((d) => ({ ...d, [active]: "" }));
              }}
              onDelete={() =>
                selectedMsg && selectedMsg.author === (user?.name || "") && handleDelete(selectedMsg.id)
              }
              canDelete={!!(selectedMsg && selectedMsg.author === (user?.name || ""))}
              replyPreview={replyTo}
              onClearReply={() => setReplyTo(null)}
              attachments={attachments}
              onAddFiles={addFiles}
              onRemoveAttachment={removeAttachment}
            />
          </div>
        </div>
      </main>

      <footer className="p-3 text-[11px] sm:text-xs text-gray-500 border-t bg-gray-50 text-center">
        © {new Date().getFullYear()} BMVT · Chat (connecté au back)
      </footer>

      {/* Lightbox de prévisualisation */}
      <Lightbox item={previewItem} onClose={() => setPreviewItem(null)} />
      {/* Toasts */}
      <Toasts items={toasts} onClose={closeToast} />
    </div>
  );
}
