// src/pages/pelerins/EnregistrementsPelerins.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ========= Config API ========= */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "http://localhost:4000";

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

/* ========= Helpers ========= */
function mediaURL(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = API_BASE.replace(/\/+$/, "");
  const rel  = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}
function isPdfPath(p="") {
  return typeof p === "string" && /\.pdf(\?|#|$)/i.test(p);
}
function normSexe(s) {
  if (!s) return "—";
  const v = String(s).toUpperCase();
  return v === "M" ? "Masculin" : v === "F" ? "Féminin" : s;
}
function ucFirst(x) {
  if (!x) return "";
  const s = String(x);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatDate(d) {
  if (!d) return "—";
  const t = Date.parse(d);
  return Number.isNaN(t) ? "—" : new Date(t).toLocaleDateString("fr-FR");
}
function normalizeRow(r) {
  return {
    id: r.id,
    photoPelerin: r.photo_pelerin_path || r.photoPelerin || "",
    photoPasseport: r.photo_passeport_path || r.photoPasseport || "",
    nom: r.nom || "",
    prenoms: r.prenoms || "",
    dateNaissance: r.date_naissance || "",
    lieuNaissance: r.lieu_naissance || "",
    sexe: normSexe(r.sexe),
    adresse: r.adresse || "",
    contacts: r.contact || "",
    numPasseport: r.num_passeport || "",
    offre: ucFirst(r.offre) || "",
    voyage: ucFirst(r.voyage) || "",
    anneeVoyage: String(r.annee_voyage ?? ""),
    urgenceNom: r.ur_nom || "",
    urgencePrenoms: r.ur_prenoms || "",
    urgenceContact: r.ur_contact || "",
    urgenceResidence: r.ur_residence || "",
    enregistrePar: r.created_by_name ? `Agent: ${r.created_by_name}` : "—",
    createdAt: r.created_at || r.createdAt || null,
  };
}

/* ========= mini toast ========= */
function useToast() {
  const [msg, setMsg] = useState(null); // {text,type}
  const push = (text, type="ok") => {
    setMsg({ text, type });
    clearTimeout(push._t);
    push._t = setTimeout(() => setMsg(null), 2500);
  };
  const Toast = () =>
    msg ? (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className={
          "fixed bottom-4 right-4 z-[60] max-w-[90vw] sm:max-w-xs rounded-xl px-4 py-3 text-sm shadow-lg text-white " +
          (msg.type === "err" ? "bg-rose-600" : "bg-emerald-600")
        }
        role="status"
        aria-live="polite"
      >
        {msg.text}
      </motion.div>
    ) : null;
  return { push, Toast };
}

/* =========================
   Composant principal
   ========================= */
export default function EnregistrementsPelerins() {
  const [records, setRecords] = useState([]);
  const [q, setQ] = useState("");
  const [sexe, setSexe] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { push, Toast } = useToast();

  // états modales
  const [detail, setDetail] = useState(null);   // objet normalisé
  const [editing, setEditing] = useState(null); // objet normalisé

  // viewers
  const [pdfSrc, setPdfSrc] = useState("");
  const [imgSrc, setImgSrc] = useState("");

  async function fetchList() {
    setLoading(true);
    setErr("");
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/pelerins`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setRecords(items.map(normalizeRow));
    } catch (e) {
      setErr(e.message || "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchList(); }, []);

  /* Filtrage */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return records.filter((p) => {
      const bySex = sexe === "all" ? true : String(p.sexe || "").toLowerCase() === sexe.toLowerCase();
      if (!bySex) return false;
      if (!s) return true;
      const hay = [
        p.nom, p.prenoms, p.contacts, p.numPasseport, p.offre, p.voyage,
        p.anneeVoyage, p.sexe, p.adresse, p.lieuNaissance,
        p.urgenceNom, p.urgencePrenoms, p.urgenceContact, p.urgenceResidence,
        p.enregistrePar,
      ].map((x) => String(x || "").toLowerCase()).join(" ");
      return hay.includes(s);
    });
  }, [q, sexe, records]);

  const handlePrint = () => window.print();

  /* ===== Actions ===== */
  async function openDetail(id) {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/pelerins/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const row = await res.json();
      setDetail(normalizeRow(row));
      push("Détail ouvert.", "ok");
    } catch (e) {
      push("Impossible d’ouvrir le détail.", "err");
    }
  }

  async function askDelete(row) {
    if (!window.confirm(`Supprimer le pèlerin "${row.nom} ${row.prenoms}" ?`)) return;
    const prev = records;
    setRecords((a) => a.filter((x) => x.id !== row.id)); // optimiste
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/pelerins/${row.id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`; try { const j = await res.json(); msg = j?.message || msg; } catch {}
        throw new Error(msg);
      }
      push("Pèlerin supprimé.");
    } catch (e) {
      setRecords(prev); // rollback
      push("Suppression impossible.", "err");
    }
  }

  function openEdit(row) {
    setEditing({
      ...row,
      _filePelerin: null,
      _filePasseport: null,
      sexe: row.sexe?.startsWith("Mas") ? "M" : row.sexe?.startsWith("Fé") ? "F" : "",
      dateNaissance: row.dateNaissance?.slice(0, 10) || "",
      offre: row.offre?.toLowerCase() || "",
      voyage: row.voyage?.toLowerCase() || "",
    });
  }

  async function saveEdit(form) {
    try {
      const token = getToken();
      const hasFiles = !!(form._filePelerin || form._filePasseport);
      let res;

      if (hasFiles) {
        const fd = new FormData();
        fd.append("nom", form.nom || "");
        fd.append("prenoms", form.prenoms || "");
        fd.append("date_naissance", form.dateNaissance || "");
        fd.append("lieu_naissance", form.lieuNaissance || "");
        if (form.sexe) fd.append("sexe", form.sexe);
        fd.append("adresse", form.adresse || "");
        fd.append("contact", form.contacts || "");
        fd.append("num_passeport", form.numPasseport || "");
        fd.append("offre", form.offre || "");
        fd.append("voyage", form.voyage || "");
        fd.append("annee_voyage", form.anneeVoyage || "");
        fd.append("ur_nom", form.urgenceNom || "");
        fd.append("ur_prenoms", form.urgencePrenoms || "");
        fd.append("ur_contact", form.urgenceContact || "");
        fd.append("ur_residence", form.urgenceResidence || "");
        if (form._filePelerin)   fd.append("photoPelerin", form._filePelerin);
        if (form._filePasseport) fd.append("photoPasseport", form._filePasseport);

        res = await fetch(`${API_BASE}/api/pelerins/${form.id}`, {
          method: "PUT",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fd,
          credentials: "include",
        });
      } else {
        const payload = {
          nom: form.nom || "",
          prenoms: form.prenoms || "",
          date_naissance: form.dateNaissance || "",
          lieu_naissance: form.lieuNaissance || "",
          sexe: form.sexe || null,
          adresse: form.adresse || "",
          contact: form.contacts || "",
          num_passeport: form.numPasseport || "",
          offre: form.offre || "",
          voyage: form.voyage || "",
          annee_voyage: form.anneeVoyage || "",
          ur_nom: form.urgenceNom || "",
          ur_prenoms: form.urgencePrenoms || "",
          ur_contact: form.urgenceContact || "",
          ur_residence: form.urgenceResidence || "",
        };
        res = await fetch(`${API_BASE}/api/pelerins/${form.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }

      push("Mise à jour effectuée.");
      setEditing(null);
      await fetchList();
    } catch (e) {
      console.error("[saveEdit]", e);
      push(e.message || "Échec de mise à jour", "err");
    }
  }

  /* ===== Variants (framer-motion) ===== */
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };
  const list = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };

  return (
    <section className="mt-6">
      <Toast />

      {/* barre d’action */}
      <div className="no-print mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Enregistrements des pèlerins</h2>
          <p className="text-slate-600 text-sm">Toutes les informations saisies + agent enregistreur.</p>
          {loading && <p className="text-slate-500 text-sm mt-1">Chargement…</p>}
          {err && <p className="text-rose-600 text-sm mt-1">{err}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-72">
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, passeport, agent, ville, offre...)"
              className="peer w-full rounded-xl border border-slate-200 bg-white/90 backdrop-blur px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 shadow-sm focus:shadow transition"
            />
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: q ? 1 : 0 }}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400"
            >{filtered.length} résultats</motion.span>
          </div>
          <select
            value={sexe} onChange={(e) => setSexe(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 shadow-sm transition"
          >
            <option value="all">Tous</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
          <button onClick={handlePrint} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 active:scale-[.98] shadow-sm">
            Imprimer la liste
          </button>
        </div>
      </div>

      {/* ===================== ZONE IMPRIMABLE ===================== */}
      <div className="print-area report">
        <div className="print-header text-center mb-3">
          <h1 className="title">LISTE DES PÈLERINS</h1>
          <p className="subtitle">({sexe === "all" ? "TOUS" : sexe.toUpperCase()})</p>
        </div>

        {/* ===== CARTES (mobile) ===== */}
        <AnimatePresence initial={false}>
          <motion.div
            variants={list}
            initial="hidden"
            animate="show"
            className="cards grid gap-3 lg:hidden"
          >
            {loading ? (
              <SkeletonCards />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((p, i) => (
                <CardRow key={p.id ?? i} i={i} p={p}
                  onOpenDetail={() => openDetail(p.id)}
                  onOpenEdit={() => openEdit(p)}
                  onDelete={() => askDelete(p)}
                  setPdfSrc={setPdfSrc}
                  setImgSrc={setImgSrc}
                  fadeUp={fadeUp}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* ===== TABLEAU (desktop) ===== */}
        <div className="paper hidden lg:block">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="table-wrap overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full data-table">
                <thead className="bg-slate-50/80 sticky top-0 backdrop-blur z-10">
                  <tr>
                    <Th>#</Th>
                    <Th>Photos/passeports</Th>
                    <Th>Nom & Prénoms</Th>
                    <Th>Date | Lieu Naiss.</Th>
                    <Th>Sexe</Th>
                    <Th className="hidden xl:table-cell">Adresse</Th>
                    <Th>Contacts</Th>
                    <Th>N° Passeport</Th>
                    <Th className="hidden lg:table-cell">Offre</Th>
                    <Th className="hidden lg:table-cell">Voyage</Th>
                    <Th>Année</Th>
                    <Th className="hidden lg:table-cell">Urgence (Nom, Prénoms, Tél, Résidence)</Th>
                    <Th>Agent</Th>
                    <Th>Créé le</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <MotionTableRow key={p.id ?? i} index={i} p={p}
                      onOpenDetail={() => openDetail(p.id)}
                      onOpenEdit={() => openEdit(p)}
                      onDelete={() => askDelete(p)}
                      setPdfSrc={setPdfSrc}
                      setImgSrc={setImgSrc}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modales (full responsive) */}
      <AnimatePresence>
        {detail && (
          <DetailModal
            data={detail}
            onClose={() => setDetail(null)}
            onOpenPdf={(src)=>setPdfSrc(src)}
            onOpenImage={(src)=>setImgSrc(src)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editing && (
          <EditModal
            data={editing}
            onClose={() => setEditing(null)}
            onSave={saveEdit}
            onOpenPdf={(src)=>setPdfSrc(src)}
            onOpenImage={(src)=>setImgSrc(src)}
          />
        )}
      </AnimatePresence>

      {/* Viewers plein écran */}
      <AnimatePresence>
        {pdfSrc && <PDFViewer src={pdfSrc} onClose={() => setPdfSrc("")} />}
      </AnimatePresence>
      <AnimatePresence>
        {imgSrc && <ImageViewer src={imgSrc} onClose={() => setImgSrc("")} />}
      </AnimatePresence>
    </section>
  );
}

/* ====== UI bits ====== */
function Th({ children, className = "" }) {
  return (
    <th className={`px-3 py-2 border-b border-slate-200 text-slate-600 text-[12px] font-semibold ${className}`}>{children}</th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 border-b border-slate-200 text-slate-900 ${className}`}>{children}</td>
  );
}
function Btn({ children, tone = "default", type = "button", className="", ...props }) {
  const styles = {
    default: "bg-white border border-slate-300 text-slate-900 hover:bg-slate-50",
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-transparent",
    warn: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent",
  };
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      {...props}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${styles[tone]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ====== Cartes (mobile) ====== */
function CardRow({ i, p, onOpenDetail, onOpenEdit, onDelete, setPdfSrc, setImgSrc, fadeUp }) {
  const agentName = String(p.enregistrePar || "").replace(/^agent\s*:\s*/i, "").trim() || "—";
  const photoPil = mediaURL(p.photoPelerin);
  const photoPass = mediaURL(p.photoPasseport);
  const passIsPdf = isPdfPath(photoPass);
  const pilIsPdf  = isPdfPath(photoPil);

  return (
    <motion.article
      variants={fadeUp}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow transition"
    >
      {/* images / PDF badges */}
      <div className="flex justify-center gap-2 mb-2">
        {photoPil ? (
          pilIsPdf ? (
            <button
              type="button"
              onClick={() => setPdfSrc(photoPil)}
              title="Voir PDF"
              className="h-20 w-16 rounded-md border grid place-items-center text-[11px] font-bold text-blue-700 bg-blue-50"
            >PDF</button>
          ) : (
            <button type="button" onClick={() => setImgSrc(photoPil)} title="Voir l’image" className="focus:ring-2 focus:ring-blue-300 rounded-md">
              <img src={photoPil} alt="Pèlerin" className="h-20 w-16 object-cover rounded-md border" />
            </button>
          )
        ) : (
          <div className="h-20 w-16 rounded-md border grid place-items-center text-[11px] text-slate-400">Pas de photo</div>
        )}
        {photoPass ? (
          passIsPdf ? (
            <button
              type="button"
              onClick={() => setPdfSrc(photoPass)}
              title="Voir PDF"
              className="h-20 w-16 rounded-md border grid place-items-center text-[11px] font-bold text-blue-700 bg-blue-50"
            >PDF</button>
          ) : (
            <button type="button" onClick={() => setImgSrc(photoPass)} title="Voir l’image" className="focus:ring-2 focus:ring-blue-300 rounded-md">
              <img src={photoPass} alt="Passeport" className="h-20 w-16 object-cover rounded-md border" />
            </button>
          )
        ) : (
          <div className="h-20 w-16 rounded-md border grid place-items-center text-[11px] text-slate-400">Pas de passeport</div>
        )}
      </div>

      {/* entête */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] text-slate-500">#{i + 1}</div>
          <div className="text-base font-extrabold text-slate-900">{p.nom} {p.prenoms}</div>
          <div className="text-[13px] text-slate-600">
            {p.sexe || "—"} • Passeport : <span className="font-mono">{p.numPasseport || "—"}</span>
          </div>
        </div>
        <div className="text-right text-[13px] text-slate-600">
          <div>{formatDate(p.createdAt)}</div>
          <div className="text-slate-900 font-semibold">Agent: {agentName}</div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-3 flex justify-end gap-2 flex-wrap">
        <Btn onClick={onOpenDetail}>Détail</Btn>
        <Btn onClick={onOpenEdit} tone="primary">Modifier</Btn>
        <Btn onClick={onDelete} tone="warn">Supprimer</Btn>
      </div>
    </motion.article>
  );
}

/* ====== Lignes tableau (desktop) ====== */
function MotionTableRow({ index, p, onOpenDetail, onOpenEdit, onDelete, setPdfSrc, setImgSrc }) {
  const agentName = String(p.enregistrePar || "").replace(/^agent\s*:\s*/i, "").trim() || "—";
  const photoPil = mediaURL(p.photoPelerin);
  const photoPass = mediaURL(p.photoPasseport);
  const pilIsPdf  = isPdfPath(photoPil);
  const passIsPdf = isPdfPath(photoPass);

  return (
    <motion.tr initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.02 }} className="row">
      <Td className="muted">{index + 1}</Td>
      <Td>
        <div className="flex gap-1">
          {photoPil ? (
            pilIsPdf ? (
              <button
                type="button"
                title="Voir PDF"
                onClick={() => setPdfSrc(photoPil)}
                className="h-10 w-8 rounded border bg-blue-50 grid place-items-center text-[9px] font-bold text-blue-700"
              >PDF</button>
            ) : (
              <button type="button" onClick={() => setImgSrc(photoPil)} title="Voir l’image" className="focus:ring-2 focus:ring-blue-300 rounded">
                <img src={photoPil} alt="Pèlerin" className="h-10 w-8 rounded border object-cover" />
              </button>
            )
          ) : (
            <div className="h-10 w-8 rounded border bg-gray-50 grid place-items-center text-[9px] text-gray-400">—</div>
          )}
          {photoPass ? (
            passIsPdf ? (
              <button
                type="button"
                title="Voir PDF"
                onClick={() => setPdfSrc(photoPass)}
                className="h-10 w-8 rounded border bg-blue-50 grid place-items-center text-[9px] font-bold text-blue-700"
              >PDF</button>
            ) : (
              <button type="button" onClick={() => setImgSrc(photoPass)} title="Voir l’image" className="focus:ring-2 focus:ring-blue-300 rounded">
                <img src={photoPass} alt="Passeport" className="h-10 w-8 rounded border object-cover" />
              </button>
            )
          ) : (
            <div className="h-10 w-8 rounded border bg-gray-50 grid place-items-center text-[9px] text-gray-400">—</div>
          )}
        </div>
      </Td>
      <Td className="strong">{p.nom} {p.prenoms}</Td>
      <Td>
        <div>{formatDate(p.dateNaissance)}</div>
        <div className="muted">{p.lieuNaissance || "—"}</div>
      </Td>
      <Td>{p.sexe || "—"}</Td>
      <Td className="wrap hidden xl:table-cell">{p.adresse || "—"}</Td>
      <Td>{p.contacts || "—"}</Td>
      <Td className="mono">{p.numPasseport || "—"}</Td>
      <Td className="hidden lg:table-cell">{p.offre || "—"}</Td>
      <Td className="wrap hidden lg:table-cell">{p.voyage || "—"}</Td>
      <Td>{p.anneeVoyage || "—"}</Td>
      <Td className="wrap hidden lg:table-cell">
        <span className="strong">{p.urgenceNom} {p.urgencePrenoms}</span>{" "}
        • {p.urgenceContact || "—"} • {p.urgenceResidence || "—"}
      </Td>
      <Td className="strong">{agentName}</Td>
      <Td>{formatDate(p.createdAt)}</Td>
      <Td className="text-right">
        <div className="inline-flex gap-2 flex-wrap justify-end">
          <Btn onClick={onOpenDetail}>Détail</Btn>
          <Btn onClick={onOpenEdit} tone="primary">Modifier</Btn>
          <Btn onClick={onDelete} tone="warn">Supprimer</Btn>
        </div>
      </Td>
    </motion.tr>
  );
}

/* ====== Modale Détail ====== */
function DetailModal({ data, onClose, onOpenPdf, onOpenImage }) {
  const pil = mediaURL(data.photoPelerin);
  const pass = mediaURL(data.photoPasseport);
  const pilIsPdf  = isPdfPath(pil);
  const passIsPdf = isPdfPath(pass);

  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div className="relative z-10 h-full w-full p-2 sm:p-4 grid" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}>
        <div
          role="dialog"
          aria-modal="true"
          className="
            m-auto sm:m-0 sm:ml-auto
            h-full sm:h-auto
            w-full sm:w-[min(820px,95vw)]
            bg-white border border-slate-200 shadow-2xl
            rounded-none sm:rounded-2xl
            flex flex-col
            max-h-[100svh] sm:max-h-[95vh]
          "
        >
          <div className="flex items-center justify-between gap-4 p-4 border-b bg-white sticky top-0">
            <h4 className="text-base sm:text-lg font-extrabold">Détail du pèlerin</h4>
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="flex gap-3">
              {pil ? (
                pilIsPdf ? (
                  <button
                    type="button"
                    onClick={() => onOpenPdf?.(pil)}
                    className="h-28 w-24 rounded-md border grid place-items-center text-[11px] font-bold text-blue-700 bg-blue-50"
                    title="Voir le PDF"
                  >PDF</button>
                ) : (
                  <button type="button" onClick={() => onOpenImage?.(pil)} title="Voir l’image">
                    <img src={pil} alt="" className="h-28 w-24 object-cover rounded-md border" />
                  </button>
                )
              ) : (
                <div className="h-28 w-24 rounded-md border grid place-items-center text-[11px] text-slate-400">—</div>
              )}
              {pass ? (
                passIsPdf ? (
                  <button
                    type="button"
                    onClick={() => onOpenPdf?.(pass)}
                    className="h-28 w-24 rounded-md border grid place-items-center text-[11px] font-bold text-blue-700 bg-blue-50"
                    title="Voir le PDF"
                  >PDF</button>
                ) : (
                  <button type="button" onClick={() => onOpenImage?.(pass)} title="Voir l’image">
                    <img src={pass} alt="" className="h-28 w-24 object-cover rounded-md border" />
                  </button>
                )
              ) : (
                <div className="h-28 w-24 rounded-md border grid place-items-center text-[11px] text-slate-400">—</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label="Nom & Prénoms">{data.nom} {data.prenoms}</Field>
              <Field label="Sexe">{data.sexe}</Field>
              <Field label="Naissance">{formatDate(data.dateNaissance)} — {data.lieuNaissance || "—"}</Field>
              <Field label="Adresse">{data.adresse || "—"}</Field>
              <Field label="Contacts">{data.contacts || "—"}</Field>
              <Field label="Passeport">{data.numPasseport || "—"}</Field>
              <Field label="Offre">{data.offre || "—"}</Field>
              <Field label="Voyage">{data.voyage || "—"}</Field>
              <Field label="Année">{data.anneeVoyage || "—"}</Field>
              <Field label="Urgence">{data.urgenceNom} {data.urgencePrenoms} • {data.urgenceContact || "—"} • {data.urgenceResidence || "—"}</Field>
              <Field label="Agent">{String(data.enregistrePar || "").replace(/^agent\s*:\s*/i, "") || "—"}</Field>
              <Field label="Créé le">{formatDate(data.createdAt)}</Field>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ====== Modale Edition (fichiers + preview PDF/IMG + view) ====== */
function EditModal({ data, onClose, onSave, onOpenPdf, onOpenImage }) {
  const [form, setForm] = useState(data);
  const [saving, setSaving] = useState(false);
  const [urlPil, setUrlPil] = useState("");
  const [urlPass, setUrlPass] = useState("");

  function ch(e) {
    const { name, value } = e.target;
    if (name === "numPasseport") {
      const v = value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 9);
      setForm((f) => ({ ...f, numPasseport: v }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  }
  function chFile(e) {
    const { name, files } = e.target;
    const file = files?.[0] || null;
    setForm((f) => ({ ...f, [name]: file }));
    if (name === "_filePelerin") {
      if (urlPil) URL.revokeObjectURL(urlPil);
      setUrlPil(file ? URL.createObjectURL(file) : "");
    } else if (name === "_filePasseport") {
      if (urlPass) URL.revokeObjectURL(urlPass);
      setUrlPass(file ? URL.createObjectURL(file) : "");
    }
  }
  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const pilIsPdf  = form._filePelerin && (form._filePelerin.type === "application/pdf" || form._filePelerin.name?.toLowerCase().endsWith(".pdf"));
  const passIsPdf = form._filePasseport && (form._filePasseport.type === "application/pdf" || form._filePasseport.name?.toLowerCase().endsWith(".pdf"));

  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div className="relative z-10 h-full w-full p-2 sm:p-4 grid" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}>
        <form
          onSubmit={submit}
          role="dialog"
          aria-modal="true"
          className="
            m-auto sm:m-0 sm:ml-auto
            h-full sm:h-auto
            w-full sm:w-[min(860px,95vw)]
            bg-white border border-slate-200 shadow-2xl
            rounded-none sm:rounded-2xl
            flex flex-col
            max-h-[100svh] sm:max-h-[95vh]
          "
        >
          <div className="flex items-center justify-between gap-4 p-4 border-b bg-white sticky top-0">
            <h4 className="text-base sm:text-lg font-extrabold">Modifier le pèlerin</h4>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50" onClick={onClose}>
              Fermer
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Fichiers (optionnels) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Photo pèlerin (JPG/PNG/PDF)</label>
                <input type="file" name="_filePelerin" accept="image/*,.pdf,application/pdf" onChange={chFile} />
                {form._filePelerin && (
                  <div className="mt-2 h-28 w-24 rounded border overflow-hidden">
                    {pilIsPdf ? (
                      <button
                        type="button"
                        onClick={() => onOpenPdf?.(urlPil)}
                        title="Voir le PDF"
                        className="h-full w-full grid place-items-center text-[12px] font-bold text-blue-700 bg-blue-50"
                      >PDF</button>
                    ) : (
                      <button type="button" onClick={() => onOpenImage?.(urlPil)} title="Voir l’image">
                        <img src={urlPil} alt="Aperçu" className="h-full w-full object-cover" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Photo passeport (JPG/PNG/PDF)</label>
                <input type="file" name="_filePasseport" accept="image/*,.pdf,application/pdf" onChange={chFile} />
                {form._filePasseport && (
                  <div className="mt-2 h-28 w-24 rounded border overflow-hidden">
                    {passIsPdf ? (
                      <button
                        type="button"
                        onClick={() => onOpenPdf?.(urlPass)}
                        title="Voir le PDF"
                        className="h-full w-full grid place-items-center text-[12px] font-bold text-blue-700 bg-blue-50"
                      >PDF</button>
                    ) : (
                      <button type="button" onClick={() => onOpenImage?.(urlPass)} title="Voir l’image">
                        <img src={urlPass} alt="Aperçu" className="h-full w-full object-cover" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Champs texte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Text label="Nom" name="nom" value={form.nom} onChange={ch} />
              <Text label="Prénoms" name="prenoms" value={form.prenoms} onChange={ch} />
              <Text label="Date de naissance" type="date" name="dateNaissance" value={form.dateNaissance} onChange={ch} />
              <Text label="Lieu de naissance" name="lieuNaissance" value={form.lieuNaissance} onChange={ch} />
              <Select
                label="Sexe" name="sexe" value={form.sexe}
                onChange={ch}
                options={[{v:"",l:"—"}, {v:"M",l:"Masculin"}, {v:"F",l:"Féminin"}]}
              />
              <Text label="Adresse" name="adresse" value={form.adresse} onChange={ch} />
              <Text label="Contacts" name="contacts" value={form.contacts} onChange={ch} />
              <Text
                label="N° passeport"
                name="numPasseport"
                value={form.numPasseport}
                onChange={ch}
                minLength={9}
                maxLength={9}
                pattern="^[A-Z0-9]{9}$"
                title="9 caractères alphanumériques (A–Z, 0–9)"
              />
              <Select
                label="Offre" name="offre" value={form.offre}
                onChange={ch}
                options={[{v:"",l:"—"},{v:"standard",l:"Standard"},{v:"confort",l:"Confort"},{v:"premium",l:"Premium"}]}
              />
              <Select
                label="Voyage" name="voyage" value={form.voyage}
                onChange={ch}
                options={[{v:"",l:"—"},{v:"vol",l:"Vol"},{v:"bus",l:"Bus"},{v:"mixte",l:"Mixte"}]}
              />
              <Text label="Année voyage" name="anneeVoyage" value={form.anneeVoyage} onChange={ch} />
              <Text label="Urgence — Nom" name="urgenceNom" value={form.urgenceNom} onChange={ch} />
              <Text label="Urgence — Prénoms" name="urgencePrenoms" value={form.urgencePrenoms} onChange={ch} />
              <Text label="Urgence — Contact" name="urgenceContact" value={form.urgenceContact} onChange={ch} />
              <Text label="Urgence — Résidence" name="urgenceResidence" value={form.urgenceResidence} onChange={ch} />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t bg-white sticky bottom-0">
            <Btn type="button" onClick={onClose}>Annuler</Btn>
            <Btn tone="primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Btn>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ====== PDF Viewer ====== */
function PDFViewer({ src, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 h-full w-full flex flex-col">
        <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-white px-3 py-2 flex items-center justify-between">
          <div className="font-semibold text-sm truncate">Aperçu PDF</div>
          <div className="flex items-center gap-2">
            <a href={src} download className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Télécharger</a>
            <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Fermer</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-900">
          <iframe title="PDF" src={src} className="w-full h-full" />
        </div>
      </div>
    </motion.div>
  );
}

/* ====== Image Viewer (lightbox) ====== */
function ImageViewer({ src, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-white px-3 py-2 flex items-center justify-between">
          <div className="font-semibold text-sm truncate">Aperçu image</div>
          <div className="flex items-center gap-2">
            <a href={src} download className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Télécharger</a>
            <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Fermer</button>
          </div>
        </div>
        <div className="flex-1 grid place-items-center bg-black">
          <motion.img
            src={src}
            alt="aperçu"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="max-h-[92vh] max-w-[96vw] object-contain"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ===== small inputs ===== */
function Field({ label, children }) {
  return (
    <div className="grid gap-1">
      <span className="text-[12px] font-semibold text-slate-700">{label}</span>
      {children}
    </div>
  );
}
function Text({ label, ...props }) {
  return (
    <Field label={label}>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 shadow-sm"
      />
    </Field>
  );
}
function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      <select
        {...props}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300 shadow-sm"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </Field>
  );
}

/* ====== Skeletons & Empty ====== */
function SkeletonCards() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-20 w-full bg-slate-100 rounded" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
            <div className="h-3 w-2/3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
function SkeletonTable({ rows = 8 }) {
  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-10 bg-slate-50" />
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-white" />
        ))}
      </div>
    </div>
  );
}
function EmptyState() {
  return (
    <div className="text-center py-10 text-slate-600">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 grid place-items-center border border-slate-200">
        <span className="text-lg">🔎</span>
      </div>
      <p className="font-semibold">Aucun enregistrement trouvé</p>
      <p className="text-sm">Essayez un autre mot-clé ou retirez les filtres.</p>
    </div>
  );
}
