import React, { useMemo, useState, useEffect } from "react";

/* =========================
   Données de démonstration
   ========================= */
const SAMPLE = [
  { id: rid(), nom: "HAJJ", annee: 2025 },
  { id: rid(), nom: "OUMRAH", annee: 2025 },
];

export default function Voyages() {
  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem("voyages.rows");
      return raw ? JSON.parse(raw) : SAMPLE;
    } catch {
      return SAMPLE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("voyages.rows", JSON.stringify(rows));
    } catch {}
  }, [rows]);

  const [nomVoyage, setNomVoyage] = useState("HAJJ");
  const [annee, setAnnee] = useState("2025");
  const [selectedId, setSelectedId] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okNom = nomVoyage ? r.nom.toUpperCase() === nomVoyage.toUpperCase() : true;
      const okAnnee = annee ? String(r.annee) === String(annee) : true;
      return okNom && okAnnee;
    });
  }, [rows, nomVoyage, annee]);

  useEffect(() => {
    if (!filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  /* ===== CRUD ===== */
  function openCreate() {
    setEditingId(null);
    setForm({ nom: nomVoyage, annee });
    setOpenModal(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({ nom: row.nom, annee: String(row.annee) });
    setOpenModal(true);
  }

  function save(e) {
    e.preventDefault();
    const payload = normalize(form);
    if (!payload.nom || !payload.annee) return;

    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r)));
      setSelectedId(editingId);
    } else {
      const created = { id: rid(), ...payload };
      setRows((prev) => [created, ...prev]);
      setSelectedId(created.id);
    }

    setOpenModal(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function remove(row) {
    const ok = window.confirm(`Supprimer le voyage "${row.nom}" (${row.annee}) ?`);
    if (!ok) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 rounded-t-2xl" />
        <div className="p-5 md:p-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-center md:text-left">
            VOYAGE
          </h1>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <Field label="Nom voyage">
              <select
                value={nomVoyage}
                onChange={(e) => setNomVoyage(e.target.value)}
                className="input"
              >
                <option value="HAJJ">HAJJ</option>
                <option value="OUMRAH">OUMRAH</option>
              </select>
            </Field>

            <Field label="Année">
              <select
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                className="input"
              >
                {yearsAround(2025, 5).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>

            <div className="hidden lg:block" />

            <div className="flex flex-wrap gap-2 justify-stretch lg:justify-end">
              <button onClick={openCreate} className="btn-blue">
                ＋ Ajouter
              </button>
              <button
                onClick={() => {
                  const row = filtered.find((r) => r.id === selectedId);
                  row ? remove(row) : alert("Sélectionne une ligne.");
                }}
                className="btn-rose"
                disabled={!selectedId}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <Th className="w-[260px]">IDENTIFIANT DE VOYAGE</Th>
                <Th>NOMVOYAGE</Th>
                <Th className="w-[160px]">ANNEEVOYAGE</Th>
                <Th className="w-[220px] text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    Aucun voyage.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer ${
                        active ? "bg-blue-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <Td>
                        <div className="inline-flex items-center gap-2 font-semibold">
                          <span className="inline-grid h-6 w-6 place-items-center rounded bg-blue-600 text-white text-xs">
                            {r.id.slice(-2)}
                          </span>
                          <span>{r.nom}</span>
                        </div>
                      </Td>
                      <Td className="font-semibold">{r.nom}</Td>
                      <Td className="font-mono">{r.annee}</Td>
                      <Td className="text-right">
                        <div className="inline-flex gap-2 pr-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(r);
                            }}
                            className="btn-mini"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(r);
                            }}
                            className="btn-mini-rose"
                          >
                            Supprimer
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Version mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`px-4 py-3 ${r.id === selectedId ? "bg-blue-50/80" : "bg-white"}`}
              onClick={() => setSelectedId(r.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.nom}</span>
                <span className="font-mono text-slate-600">{r.annee}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => openEdit(r)} className="btn-mini">
                  Modifier
                </button>
                <button onClick={() => remove(r)} className="btn-mini-rose">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modale */}
      {openModal && (
        <Modal
          title={editingId ? "Modifier le voyage" : "Ajouter un voyage"}
          onClose={() => {
            setOpenModal(false);
            setEditingId(null);
            setForm(emptyForm());
          }}
        >
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom voyage">
                <select
                  className="input"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                >
                  <option value="HAJJ">HAJJ</option>
                  <option value="OUMRAH">OUMRAH</option>
                </select>
              </Field>
              <Field label="Année">
                <input
                  type="number"
                  className="input"
                  min={2000}
                  max={2100}
                  value={form.annee}
                  onChange={(e) => setForm({ ...form, annee: e.target.value })}
                  placeholder="2025"
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setOpenModal(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-blue">
                {editingId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Styles utilitaires */}
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-400; }
        .btn-blue { @apply inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50; }
        .btn-rose { @apply inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50; }
        .btn-outline { @apply inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50; }
        .btn-mini { @apply rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50; }
        .btn-mini-rose { @apply rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700; }
      `}</style>
    </div>
  );
}

/* Composants utilitaires */
function Th({ children, className = "" }) {
  return <th className={`px-3 py-3 text-left text-xs font-extrabold uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-3 text-slate-800 ${className}`}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* Helpers */
function emptyForm() {
  return { nom: "HAJJ", annee: "2025" };
}
function normalize(f) {
  const nom = (f.nom || "").toUpperCase().trim();
  const year = Number(String(f.annee || "").trim());
  return { nom, annee: isFinite(year) ? year : 2025 };
}
function yearsAround(center = 2025, span = 5) {
  const out = [];
  for (let y = center + span; y >= center - span; y--) out.push(y);
  return out;
}
function rid() {
  return "v" + Math.random().toString(36).slice(2, 9);
}
