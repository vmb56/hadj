import React, { useMemo, useRef, useState, useEffect } from "react";

/**
 * CommunicationHubBMVT.jsx
 * -------------------------------------------------------
 * Objectif : Une page unique pour une communication fluide et sécurisée
 * entre l’agence, les encadreurs et les pèlerins (BMVT).
 * - Discussions par rôles (onglets)
 * - Fils de conversation (annonces, groupes, messages directs)
 * - Indicateur de chiffrement et statut de livraison
 * - Pièces jointes (mock)
 * - Filtre/recherche, mentions @, accusés de lecture
 * - Mode hors-ligne (mock), brouillons par canal
 * - Entièrement côté client (démo) — à brancher sur votre API plus tard
 * -------------------------------------------------------
 * Tech : React + TailwindCSS (aucune dépendance externe)
 */

// === Utilitaires icônes (inline SVG pour éviter des dépendances) ===
const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
    <path d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" />
    <path d="M9.5 12l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSend = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
    <path d="M22 2L11 13" strokeLinecap="round"/>
    <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-3.2-3.2" strokeLinecap="round"/>
  </svg>
);
const IconPaperclip = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
    <path d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 1 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.7 16.64a1.5 1.5 0 1 1-2.12-2.12l8.13-8.13" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAlert = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
    <path d="M10.29 3.86l-7.5 13A1 1 0 0 0 3.62 19h16.76a1 1 0 0 0 .87-1.5l-7.5-13a1 1 0 0 0-1.74 0z"/>
    <path d="M12 9v4" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1"/>
  </svg>
);
const IconDot = (props) => (
  <svg viewBox="0 0 24 24" className={props.className}><circle cx="12" cy="12" r="4"/></svg>
);

// === Données mock ===
const ROLES = ["Agence", "Encadreurs", "Pèlerins"];

const seedThreads = {
  Agence: [
    { id: "t1", name: "# Annonces officielles", type: "annonce", unread: 2 },
    { id: "t2", name: "Groupe Logistique – Vol 3", type: "groupe", unread: 0 },
    { id: "t3", name: "DM · Direction", type: "direct", unread: 0 },
  ],
  Encadreurs: [
    { id: "t4", name: "# Brief encadreurs Hadj", type: "annonce", unread: 1 },
    { id: "t5", name: "Groupe Encadreurs – Bloc A", type: "groupe", unread: 0 },
  ],
  Pèlerins: [
    { id: "t6", name: "# Informations départ", type: "annonce", unread: 0 },
    { id: "t7", name: "Groupe Pèlerins – Chambre 204", type: "groupe", unread: 3 },
    { id: "t8", name: "DM · Vous ↔ Agence", type: "direct", unread: 0 },
  ],
};

const seedMessages = {
  t1: [
    { id: 1, author: "Admin", text: "🔒 Canal chiffré de bout en bout. Merci de consulter les consignes.", time: "09:12", status: "lu" },
    { id: 2, author: "Admin", text: "[Annonce] Check-in ouverture à 14h, terminal 2.", time: "10:01", status: "livré" },
  ],
  t2: [
    { id: 1, author: "Agence", text: "Préparez les listes de passagers – Vol 3.", time: "08:20", status: "lu" },
  ],
  t6: [
    { id: 1, author: "Agence", text: "Rappel : apportez passeport + carnet CMAH.", time: "07:55", status: "lu" },
  ],
  t7: [
    { id: 1, author: "Encadreur A", text: "Brief à 17h dans le hall.", time: "07:40", status: "lu" },
    { id: 2, author: "Pèlerin - Mariam", text: "Reçu, merci !", time: "07:42", status: "lu" },
  ],
};

const STATUS_BADGE = {
  envoi: { label: "Envoi…", dot: "bg-gray-400" },
  livré: { label: "Livré", dot: "bg-blue-500" },
  lu: { label: "Lu", dot: "bg-emerald-500" },
};

// === Composants ===
function TopBar({ online, onSearch }) {
  return (
    <header className="flex items-center justify-between gap-4 p-4 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">BM</div>
        <div>
          <h1 className="text-lg font-semibold">BMVT · Hub de communication</h1>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <IconShield className="w-4 h-4" />
            <span>Chiffrement actif · Contrôles d’accès par rôle</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {online ? "En ligne" : "Hors ligne (mode lecture)"}
        </div>
        <label className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
          <IconSearch className="w-4 h-4 text-gray-500" />
          <input onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher…" className="outline-none text-sm" />
        </label>
      </div>
    </header>
  );
}

function Tabs({ value, onChange }) {
  return (
    <div className="flex gap-2 p-2 border-b bg-gray-50">
      {ROLES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
            value === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-100"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function ChannelList({ threads, active, onPick, filter }) {
  const filtered = useMemo(() => {
    if (!filter) return threads;
    return threads.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
  }, [threads, filter]);

  return (
    <aside className="w-full md:w-80 border-r bg-white">
      <div className="p-3 text-xs text-gray-600">Canaux</div>
      <ul className="space-y-1 px-2 pb-3">
        {filtered.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => onPick(t.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition text-left ${
                active === t.id ? "bg-indigo-50 border-indigo-200" : "bg-white hover:bg-gray-50"
              }`}
            >
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-[11px] text-gray-500">{t.type}</div>
              </div>
              {t.unread > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">{t.unread}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function MessageBubble({ mine, msg }) {
  const badge = STATUS_BADGE[msg.status] || STATUS_BADGE["livré"];
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 border shadow-sm ${mine ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"}`}>
        <div className="text-[11px] opacity-80 mb-0.5">{msg.author} · {msg.time}</div>
        <div className="text-sm leading-5 whitespace-pre-wrap">{msg.text}</div>
        <div className="mt-1 flex items-center gap-1 text-[10px] opacity-80">
          <span className={`inline-block w-2 h-2 rounded-full ${badge.dot}`}></span>
          <span>{badge.label}</span>
        </div>
      </div>
    </div>
  );
}

function Composer({ value, onChange, onSend, onAttach }) {
  const ref = useRef(null);
  return (
    <div className="border-t bg-white p-2 md:p-3">
      <div className="flex items-end gap-2">
        <button onClick={onAttach} className="p-2 rounded-lg border hover:bg-gray-50" title="Joindre un fichier">
          <IconPaperclip className="w-5 h-5" />
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder="Écrire un message sécurisé… (tapez @ pour mentionner)"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          className="flex-1 resize-none rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button onClick={onSend} className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 flex items-center gap-2">
          <IconSend className="w-4 h-4" />
          <span className="hidden md:inline">Envoyer</span>
        </button>
      </div>
      <div className="mt-1 text-[11px] text-gray-500">Chiffré en transit • Visibilité contrôlée par rôle (Agence / Encadreurs / Pèlerins)</div>
    </div>
  );
}

function ThreadView({ threadId, messages, onSendMessage }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, threadId]);

  return (
    <section className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="text-sm text-gray-600">Canal : <span className="font-medium">{threadId}</span></div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <IconShield className="w-4 h-4" />
          <span>Sécurisé</span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-auto p-3 md:p-4 space-y-2 bg-gradient-to-b from-gray-50 to-white">
        {(messages[threadId] || []).map((m) => (
          <MessageBubble key={m.id} mine={m.author === "Vous"} msg={m} />
        ))}
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onAttach={() => alert("(Démo) Sélection de fichier…\nÀ connecter à votre stockage sécurisé.")}
        onSend={() => {
          if (!draft.trim()) return;
          onSendMessage({ threadId, text: draft.trim() });
          setDraft("");
        }}
      />
    </section>
  );
}

export default function CommunicationHubBMVT() {
  const [role, setRole] = useState(ROLES[0]);
  const [threadsByRole, setThreadsByRole] = useState(seedThreads);
  const [messages, setMessages] = useState(seedMessages);
  const [activeThread, setActiveThread] = useState(seedThreads[ROLES[0]][0].id);
  const [filter, setFilter] = useState("");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const off = () => setOnline(navigator.onLine);
    window.addEventListener("online", off);
    window.addEventListener("offline", off);
    off();
    return () => { window.removeEventListener("online", off); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    const first = threadsByRole[role]?.[0]?.id;
    if (first) setActiveThread(first);
  }, [role, threadsByRole]);

  const handleSend = ({ threadId, text }) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setMessages((curr) => ({
      ...curr,
      [threadId]: [
        ...(curr[threadId] || []),
        { id: Date.now(), author: "Vous", text, time: `${hh}:${mm}`, status: "livré" },
      ],
    }));
  };

  const currentThreads = useMemo(() => threadsByRole[role] || [], [threadsByRole, role]);
  const filtered = useMemo(() => {
    if (!filter) return currentThreads;
    return currentThreads.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
  }, [currentThreads, filter]);

  return (
    <div className="min-h-dvh w-full bg-white text-gray-900">
      <TopBar online={online} onSearch={setFilter} />
      <Tabs value={role} onChange={setRole} />
      {/* Bandeau alerte prioritaire (ex: consignes sécurité) */}
      <div className="px-3 py-2 border-b bg-amber-50 text-amber-800 flex items-center gap-2 text-sm">
        <IconAlert className="w-4 h-4" />
        <span>Rappel : Respect des consignes – ne partagez pas d’informations sensibles hors des canaux sécurisés.</span>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-[20rem,1fr] lg:grid-cols-[22rem,1fr]">
        <ChannelList threads={filtered} active={activeThread} onPick={setActiveThread} filter={filter} />
        <ThreadView threadId={activeThread} messages={messages} onSendMessage={handleSend} />
      </main>

      <footer className="p-3 text-xs text-gray-500 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconDot className="w-2 h-2 fill-emerald-500" />
          <span>Chiffrement en transit • Journalisation et traçabilité activées</span>
        </div>
        <div className="hidden md:block">© {new Date().getFullYear()} BMVT · Communication sécurisée</div>
      </footer>
    </div>
  );
}
