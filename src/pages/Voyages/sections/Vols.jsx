// src/pages/voyage/Vols.jsx
import React, { useMemo, useState } from "react";

/* =============================
   Données init (démo)
   ============================= */
const initialFlights = [
  {
    id: cryptoRandomId(),
    code: "AS401",
    company: "Air Sénégal",
    from: { code: "DSS", date: "2025-06-01 02:00" },
    to:   { code: "JED", date: "2025-06-01 12:30" },
    duration: "10h30",
    passengers: [
      { id: 1, fullname: "DIALLO Mamadou", seat: "1A", passport: "P1234567", photoUrl: "" },
      { id: 2, fullname: "TOURE Fatou",    seat: "2A", passport: "P2345678", photoUrl: "" },
      { id: 3, fullname: "KONE Ibrahim",   seat: "3A", passport: "P3456789", photoUrl: "" },
    ],
  },
];

/* =============================
   Composant principal
   ============================= */
export default function Vols() {
  const [flights, setFlights] = useState(initialFlights);

  // états modales
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignFlightId, setAssignFlightId] = useState(null);

  // form vol
  const [form, setForm] = useState(emptyFlightForm());

  // form assign
  const [assignName, setAssignName] = useState("");
  const [assignSeat, setAssignSeat] = useState("");
  const [assignPassport, setAssignPassport] = useState("");
  const [assignPhotoFile, setAssignPhotoFile] = useState(null);
  const [assignPhotoPreview, setAssignPhotoPreview] = useState("");

  const KPIs = useMemo(() => {
    const totalFlights = flights.length;
    const totalPassengers = flights.reduce((s, f) => s + f.passengers.length, 0);
    const nextDeparture = flights.map((f) => f.from?.date).filter(Boolean).sort()[0];
    const nextLabel = nextDeparture ? formatDateLabel(nextDeparture) : "—";
    return [
      { icon: "✈️", label: "Total Vols", value: totalFlights, tone: "sky" },
      { icon: "👥", label: "Total Passagers", value: totalPassengers, tone: "indigo" },
      { icon: "🕘", label: "Prochain Départ", value: nextLabel, tone: "sky" },
    ];
  }, [flights]);

  /* ---------- Actions vol ---------- */
  function openCreateModal() {
    setEditingFlightId(null);
    setForm(emptyFlightForm());
    setFlightModalOpen(true);
  }

  function openEditModal(f) {
    setEditingFlightId(f.id);
    setForm({
      code: f.code,
      company: f.company,
      fromCode: f.from?.code || "",
      fromDate: toInputDatetimeLocal(f.from?.date),
      toCode: f.to?.code || "",
      toDate: toInputDatetimeLocal(f.to?.date),
      duration: f.duration || "",
    });
    setFlightModalOpen(true);
  }

  function saveFlight(e) {
    e?.preventDefault?.();
    const payload = normalizeFlightForm(form);

    // Validations utiles
    if (!/^[A-Z0-9]{2,4}\d{1,4}$/i.test(payload.code.replace(/\s+/g, ""))) {
      alert("Code vol invalide (ex: AS401).");
      return;
    }
    if (!/^[A-Z]{3}$/.test(payload.from.code) || !/^[A-Z]{3}$/.test(payload.to.code)) {
      alert("Codes aéroport IATA attendus (ex: DSS, JED).");
      return;
    }
    const tFrom = Date.parse(payload.from.date.replace(" ", "T"));
    const tTo = Date.parse(payload.to.date.replace(" ", "T"));
    if (isNaN(tFrom) || isNaN(tTo) || tTo <= tFrom) {
      alert("L’heure d’arrivée doit être postérieure au départ.");
      return;
    }

    if (editingFlightId) {
      setFlights((arr) => arr.map((f) => (f.id === editingFlightId ? { ...f, ...payload } : f)));
    } else {
      setFlights((arr) => [{ id: cryptoRandomId(), ...payload, passengers: [] }, ...arr]);
    }
    setFlightModalOpen(false);
    setEditingFlightId(null);
    setForm(emptyFlightForm());
  }

  /* --- Supprimer un vol --- */
  function deleteFlight(flightId) {
    const f = flights.find((x) => x.id === flightId);
    if (!f) return;
    const ok = window.confirm(`Supprimer le vol ${f.code} (${f.company}) ?`);
    if (!ok) return;
    setFlights((arr) => arr.filter((x) => x.id !== flightId));
  }

  /* ---------- Assign passager ---------- */
  function openAssignModal(f) {
    setAssignFlightId(f.id);
    setAssignName("");
    setAssignSeat("");
    setAssignPassport("");
    setAssignPhotoFile(null);
    setAssignPhotoPreview("");
    setAssignModalOpen(true);
  }

  async function handleAssignPhotoChange(e) {
    const file = e.target.files?.[0];
    setAssignPhotoFile(file || null);
    if (file) {
      const dataUrl = await readFileAsDataURL(file);
      setAssignPhotoPreview(dataUrl);
    } else {
      setAssignPhotoPreview("");
    }
  }

  function assignPassenger(e) {
    e?.preventDefault?.();
    if (!assignName.trim()) return;

    const seat = formatSeat(assignSeat); // normalise "Siège 12C" -> "12C"
    const willSetSeat = Boolean(seat);
    const flight = flights.find((f) => f.id === assignFlightId);
    if (!flight) return;

    if (willSetSeat) {
      const seatTaken = flight.passengers.some((p) => (p.seat || "").toUpperCase() === seat.toUpperCase());
      if (seatTaken) {
        alert(`Le siège ${seat} est déjà attribué sur ce vol.`);
        return;
      }
    }

    setFlights((arr) =>
      arr.map((f) =>
        f.id === assignFlightId
          ? {
              ...f,
              passengers: [
                ...f.passengers,
                {
                  id: nextPassengerId(f.passengers),
                  fullname: assignName.trim(),
                  seat: willSetSeat ? seat : "—",
                  passport: assignPassport.trim(),
                  photoUrl: assignPhotoPreview || "",
                },
              ],
            }
          : f
      )
    );
    setAssignModalOpen(false);
  }

  /* --- Supprimer un passager --- */
  function deletePassenger(flightId, passengerId) {
    const flight = flights.find((f) => f.id === flightId);
    if (!flight) return;
    const pax = flight.passengers.find((p) => p.id === passengerId);
    const ok = window.confirm(
      `Retirer le pèlerin “${pax?.fullname ?? passengerId}” du vol ${flight.code} ?`
    );
    if (!ok) return;
    setFlights((arr) =>
      arr.map((f) =>
        f.id === flightId ? { ...f, passengers: f.passengers.filter((p) => p.id !== passengerId) } : f
      )
    );
  }

  /* ---------- Export CSV (avec BOM pour Excel) ---------- */
  function exportPassengersCSV(f) {
    const rows = [
      ["Vol", f.code],
      ["Compagnie", f.company],
      ["Départ", `${f.from.code} - ${formatDateLabel(f.from.date)}`],
      ["Arrivée", `${f.to.code} - ${formatDateLabel(f.to.date)}`],
      [],
      ["#", "Nom", "Passeport", "Siège"],
      ...f.passengers.map((p, i) => [String(i + 1), p.fullname, p.passport || "", p.seat || ""]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    // BOM UTF-8 pour Excel
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    downloadFile(blob, `passagers_${f.code}.csv`);
  }

  /* ---------- Impression du vol (via iframe cachée) ---------- */
  async function printFlight(f) {
    const html = renderPrintableFlightHTML(f);
    await printViaIframe(html);
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header & bouton "Nouveau Vol" */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Vols</h1>
          <p className="text-slate-500">Gestion des vols et passagers</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          onClick={openCreateModal}
        >
          <span className="text-lg leading-none">＋</span> Nouveau Vol
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIs.map((k, i) => (
          <StatCard key={i} icon={k.icon} label={k.label} value={k.value} tone={k.tone} />
        ))}
        <div className="hidden lg:block" />
      </div>

      {/* Liste des vols (cartes) */}
      <div className="space-y-5">
        {flights.map((flight) => {
          const paxCount = flight.passengers.length;
          const paxChunks = splitInCols(flight.passengers, 3);

          return (
            <section key={flight.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Bandeau principal (bleu) */}
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                          <span className="text-xl">✈️</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-2xl font-extrabold leading-tight">{flight.code}</div>
                          <div className="text-white/90">{flight.company}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                        {paxCount} passager{paxCount > 1 ? "s" : ""}
                      </span>
                      {/* Supprimer le vol */}
                      <button
                        onClick={() => deleteFlight(flight.id)}
                        className="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25"
                        title="Supprimer le vol"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* route DSS -> JED */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <div className="text-center md:text-left">
                      <div className="text-4xl font-extrabold tracking-wide">{flight.from.code}</div>
                      <div className="text-white/90">{formatDateLabel(flight.from.date)}</div>
                    </div>

                    <div className="hidden md:flex items-center justify-center">
                      <div className="h-px w-28 bg-white/40" />
                      <div className="mx-4">✈️</div>
                      <div className="h-px w-28 bg-white/40" />
                    </div>

                    <div className="text-center md:text-right">
                      <div className="text-4xl font-extrabold tracking-wide">{flight.to.code}</div>
                      <div className="text-white/90">{formatDateLabel(flight.to.date)}</div>
                    </div>
                  </div>

                  {/* durée */}
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                      ⏱ {flight.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloc Passagers + actions */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                    Liste des Passagers ({paxCount})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openAssignModal(flight)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <span className="text-lg leading-none">＋</span> Affecter un pèlerin
                    </button>
                  </div>
                </div>

                {/* Liste des passagers en 1 -> 3 colonnes */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {paxChunks.map((col, idx) => (
                    <div key={idx} className="space-y-3">
                      {col.map((p, i) => (
                        <PassengerItem
                          key={p.id ?? i}
                          index={p.id ?? i + 1}
                          fullname={p.fullname}
                          seat={p.seat}
                          passport={p.passport}
                          photoUrl={p.photoUrl}
                          onDelete={() => deletePassenger(flight.id, p.id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Actions bas de carte */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <ActionBtn onClick={() => openEditModal(flight)}>Modifier le vol</ActionBtn>
                  <ActionBtn onClick={() => exportPassengersCSV(flight)}>Exporter la liste</ActionBtn>
                  <ActionBtn onClick={() => printFlight(flight)}>Imprimer le vol</ActionBtn>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ============ MODALE VOL ============ */}
      {flightModalOpen && (
        <Modal onClose={() => setFlightModalOpen(false)} title={editingFlightId ? "Modifier le vol" : "Nouveau vol"}>
          <form onSubmit={saveFlight} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Code du vol">
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="AS401"
                  required
                />
              </Field>
              <Field label="Compagnie">
                <input
                  className="input"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Air Sénégal"
                  required
                />
              </Field>

              <Field label="Départ - Code aéroport">
                <input
                  className="input uppercase"
                  value={form.fromCode}
                  onChange={(e) => setForm({ ...form, fromCode: e.target.value.toUpperCase() })}
                  placeholder="DSS"
                  maxLength={3}
                  required
                />
              </Field>
              <Field label="Départ - Date & heure">
                <input
                  type="datetime-local"
                  className="input"
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                  required
                />
              </Field>

              <Field label="Arrivée - Code aéroport">
                <input
                  className="input uppercase"
                  value={form.toCode}
                  onChange={(e) => setForm({ ...form, toCode: e.target.value.toUpperCase() })}
                  placeholder="JED"
                  maxLength={3}
                  required
                />
              </Field>
              <Field label="Arrivée - Date & heure">
                <input
                  type="datetime-local"
                  className="input"
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                  required
                />
              </Field>

              <Field label="Durée (texte)">
                <input
                  className="input"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="10h30"
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-gray" onClick={() => setFlightModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-blue">
                {editingFlightId ? "Enregistrer" : "Créer le vol"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============ MODALE ASSIGN ============ */}
      {assignModalOpen && (
        <Modal onClose={() => setAssignModalOpen(false)} title="Affecter un pèlerin">
          <form onSubmit={assignPassenger} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom & Prénom">
                <input
                  className="input"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  placeholder="ex: KONE Ibrahim"
                  required
                />
              </Field>
              <Field label="Siège (optionnel)">
                <input
                  className="input"
                  value={assignSeat}
                  onChange={(e) => setAssignSeat(e.target.value)}
                  placeholder="12C"
                />
              </Field>

              <Field label="N° Passeport">
                <input
                  className="input"
                  value={assignPassport}
                  onChange={(e) => setAssignPassport(e.target.value)}
                  placeholder="P1234567"
                />
              </Field>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAssignPhotoChange}
                    className="input !py-1.5"
                  />
                  {assignPhotoPreview ? (
                    <img
                      src={assignPhotoPreview}
                      alt="aperçu"
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                      Aucun
                    </div>
                  )}
                </div>
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-gray" onClick={() => setAssignModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-blue">Affecter</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =============== UI bits =============== */

function StatCard({ icon, label, value, tone = "sky" }) {
  const toneMap = {
    sky:    { chip: "bg-sky-50 text-sky-700",       ring: "ring-sky-200" },
    indigo: { chip: "bg-indigo-50 text-indigo-700", ring: "ring-indigo-200" },
  }[tone] || { chip: "bg-slate-50 text-slate-700", ring: "ring-slate-200" };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ${toneMap.ring}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap.chip}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm text-slate-600">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function PassengerItem({ index, fullname, seat, passport, photoUrl, onDelete }) {
  const initials = getInitials(fullname);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {photoUrl ? (
          <img src={photoUrl} alt={fullname} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">{index}. {fullname}</div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-3">
            <span>Siège: {seat || "—"}</span>
            {passport ? <span>• Passeport: <span className="font-medium">{passport}</span></span> : null}
          </div>
        </div>
      </div>
      {/* Supprimer le pèlerin */}
      <button
        onClick={onDelete}
        className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
        title="Supprimer ce pèlerin"
      >
        🗑️
      </button>
    </div>
  );
}

function ActionBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w/full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
      {/* styles utilitaires Tailwind inline (accents bleus) */}
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300; }
        .btn-blue { @apply rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700; }
        .btn-gray { @apply rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50; }
        .uppercase { text-transform: uppercase; letter-spacing: .5px; }
      `}</style>
    </div>
  );
}

/* =============== Helpers =============== */

function splitInCols(list, cols) {
  const out = Array.from({ length: cols }, () => []);
  list.forEach((item, i) => out[i % cols].push(item));
  return out;
}
function nextPassengerId(list) {
  return (list?.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) || 0) + 1;
}
function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function toInputDatetimeLocal(s) {
  if (!s) return "";
  const d = new Date(String(s).replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDateLabel(s) {
  const d = new Date(String(s).replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function normalizeFlightForm(f) {
  return {
    code: f.code.trim().toUpperCase().replace(/\s+/g, ""),
    company: f.company.trim(),
    from: { code: (f.fromCode || "").trim().toUpperCase(), date: (f.fromDate || "").replace("T", " ") },
    to:   { code: (f.toCode   || "").trim().toUpperCase(), date: (f.toDate   || "").replace("T", " ") },
    duration: f.duration.trim(),
  };
}
function emptyFlightForm() {
  const now = new Date();
  const plus3h = new Date(now.getTime() + 3 * 3600 * 1000);
  return {
    code: "",
    company: "",
    fromCode: "DSS",
    fromDate: toInputDatetimeLocal(now.toISOString()),
    toCode: "JED",
    toDate: toInputDatetimeLocal(plus3h.toISOString()),
    duration: "03h00",
  };
}
function cryptoRandomId() {
  const n = (Math.random() * 1e8) | 0;
  return "f" + n.toString(36);
}
function getInitials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}
function formatSeat(s) {
  if (!s) return "";
  const t = s.replace(/^si[eè]ge\s*/i, "").trim();
  return t.toUpperCase();
}

/* ---------- Impression : HTML imprimable ---------- */
function renderPrintableFlightHTML(f) {
  const rows = f.passengers
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="who">
          <div class="row">
            <div class="avatar">
              ${
                p.photoUrl
                  ? `<img src="${p.photoUrl}" alt="${escapeHtml(p.fullname)}"/>`
                  : `<div class="ph">${escapeHtml(getInitials(p.fullname))}</div>`
              }
            </div>
            <div>
              <div class="name">${escapeHtml(p.fullname)}</div>
              <div class="muted">${escapeHtml(p.passport || "")}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(p.seat || "—")}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>Vol ${escapeHtml(f.code)} — Impression</title>
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --blue:#2563eb; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--ink); margin: 24px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .muted { color: var(--muted); font-size: 12px; }
  .card { border:1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .row { display:flex; align-items:center; gap:12px; }
  .kpi { display:inline-block; padding:6px 10px; background:#dbeafe; color:#1e40af; border-radius: 999px; font-weight:700; font-size:12px; }
  table { width:100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border-top:1px solid var(--line); padding: 10px; text-align: left; vertical-align: middle; }
  th { background:#f8fafc; }
  td:first-child, th:first-child { width: 48px; text-align:center; }
  .who .row { align-items: center; }
  .avatar { width:36px; height:36px; border-radius:999px; overflow:hidden; background:#f1f5f9; display:flex; align-items:center; justify-content:center; }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .ph { font-weight:700; color: var(--blue); }
  .header { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; }
  .route { display:flex; align-items:center; gap:12px; font-weight:800; font-size:22px; }
  .sep { height:1px; width:60px; background:#cbd5e1; }
  @media print { body { margin: 0; } .card { margin: 0 0 8mm; page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>Vol ${escapeHtml(f.code)} · ${escapeHtml(f.company)}</h1>
        <div class="route">
          <span>${escapeHtml(f.from.code)}</span>
          <div class="sep"></div>
          <span>✈️</span>
          <div class="sep"></div>
          <span>${escapeHtml(f.to.code)}</span>
        </div>
        <div class="muted">Départ: ${escapeHtml(formatDateLabel(f.from.date))} — Arrivée: ${escapeHtml(formatDateLabel(f.to.date))} — Durée: ${escapeHtml(f.duration)}</div>
      </div>
      <div class="kpi">${f.passengers.length} passager${f.passengers.length>1?"s":""}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Passager (Passeport)</th>
          <th>Siège</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="3" class="muted">Aucun passager.</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

/* ---------- Impression via iframe caché ---------- */
function printViaIframe(html) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed", right: 0, bottom: 0, width: 0, height: 0, border: 0, visibility: "hidden"
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();

    const run = async () => {
      const imgs = Array.from(doc.images || []);
      await Promise.all(
        imgs.map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
        )
      );
      try { await doc.fonts?.ready; } catch {}
      iframe.contentWindow.focus?.();
      iframe.contentWindow.print?.();
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 500);
    };

    if (doc.readyState === "complete") run();
    else iframe.addEventListener("load", run, { once: true });
  });
}
