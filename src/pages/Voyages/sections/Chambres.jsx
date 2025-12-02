// src/pages/voyage/Chambres.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

/* =============================
   Config API
   ============================= */
const RAW_API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  "https://hadjbackend.onrender.com";

// on enlève les / de fin pour éviter les doubles //
const API_BASE = String(RAW_API_BASE || "").replace(/\/+$/, "");

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: "include",
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/* =============================
   Appels API Chambres
   ============================= */
async function listRoomsAPI() {
  const data = await apiFetch(`/api/chambres`);
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items.map(normalizeRoomRow);
}
async function createRoomAPI(payload) {
  const data = await apiFetch(`/api/chambres`, { method: "POST", body: payload });
  return normalizeRoomRow(data);
}
async function updateRoomAPI(id, payload) {
  const data = await apiFetch(`/api/chambres/${id}`, { method: "PUT", body: payload });
  return normalizeRoomRow(data);
}
async function deleteRoomAPI(id) {
  await apiFetch(`/api/chambres/${id}`, { method: "DELETE" });
}
async function addOccupantAPI(roomId, payload) {
  const data = await apiFetch(`/api/chambres/${roomId}/occupants`, { method: "POST", body: payload });
  return data; // { id, name, passport, photoUrl }
}
async function removeOccupantAPI(roomId, oid) {
  await apiFetch(`/api/chambres/${roomId}/occupants/${oid}`, { method: "DELETE" });
}

/* =============================
   Normalisation
   ============================= */
function normalizeRoomRow(r = {}) {
  return {
    id: r.id,
    hotel: r.hotel || "",
    city: r.city || "",
    type: r.type || "double",
    capacity: Number(r.capacity) || 1,
    occupants: Array.isArray(r.occupants)
      ? r.occupants.map((o) => ({
          id: o.id,
          name: o.name,
          passport: o.passport || "",
          photoUrl: o.photoUrl || "",
        }))
      : [],
    createdAt: r.createdAt || null,
    updatedAt: r.updatedAt || null,
  };
}

/* =============================
   Page
   ============================= */
export default function Chambres() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Modale chambre (create/edit)
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [form, setForm] = useState(emptyRoomForm());

  // Modale affectation
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState(null);
  const [assignName, setAssignName] = useState("");
  const [assignPassport, setAssignPassport] = useState("");
  const [assignPhotoFile, setAssignPhotoFile] = useState(null);
  const [assignPhotoPreview, setAssignPhotoPreview] = useState("");

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const items = await listRoomsAPI();
      setRooms(items);
    } catch (e) {
      setRooms([]);
      setErr(e.message || "Échec du chargement");
      alert("Chargement des chambres impossible.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);

  // KPIs
  const { totalRooms, totalCapacity, totalOccupied, rate } = useMemo(() => {
    const tRooms = rooms.length;
    const tCap = rooms.reduce((s, r) => s + (Number(r.capacity) || 0), 0);
    const tOcc = rooms.reduce((s, r) => s + r.occupants.length, 0);
    const r = Math.round((tOcc / Math.max(1, tCap)) * 100);
    return { totalRooms: tRooms, totalCapacity: tCap, totalOccupied: tOcc, rate: r };
  }, [rooms]);

  /* ---------- Chambre: créer / éditer ---------- */
  function openCreateModal() {
    setEditingRoomId(null);
    setForm(emptyRoomForm());
    setRoomModalOpen(true);
  }
  function openEditModal(room) {
    setEditingRoomId(room.id);
    setForm({
      hotel: room.hotel,
      city: room.city,
      type: room.type,
      capacity: String(room.capacity),
    });
    setRoomModalOpen(true);
  }
  async function saveRoom(e) {
    e?.preventDefault?.();
    const payload = normalizeRoomForm(form);
    if (!payload.hotel || !payload.city) {
      alert("Hôtel et ville sont requis.");
      return;
    }
    try {
      if (editingRoomId) {
        await updateRoomAPI(editingRoomId, payload);
      } else {
        await createRoomAPI(payload);
      }
      setRoomModalOpen(false);
      setEditingRoomId(null);
      setForm(emptyRoomForm());
      await reload();
    } catch (e2) {
      alert(e2.message || "Échec de l’enregistrement.");
    }
  }

  /* ---------- Supprimer une chambre ---------- */
  async function deleteRoom(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const ok = window.confirm(`Supprimer la chambre de l'hôtel ${room.hotel} (${room.city}) ?`);
    if (!ok) return;
    try {
      await deleteRoomAPI(roomId);
      await reload();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  }

  /* ---------- Affectation occupant ---------- */
  function openAssignModal(room) {
    setAssignRoomId(room.id);
    setAssignName("");
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

  async function assignOccupant(e) {
    e?.preventDefault?.();
    if (!assignName.trim()) return;
    try {
      await addOccupantAPI(assignRoomId, {
        name: assignName.trim(),
        passport: assignPassport.trim(),
        photoUrl: assignPhotoPreview || "",
      });
      setAssignModalOpen(false);
      await reload();
    } catch (err) {
      alert(err.message || "Affectation impossible.");
    }
  }

  /* ---------- Supprimer un occupant ---------- */
  async function deleteOccupant(roomId, index) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const occ = room.occupants[index];
    if (!occ) return;
    const ok = window.confirm(`Retirer “${occ.name}” de la chambre ${room.hotel} ?`);
    if (!ok) return;
    try {
      await removeOccupantAPI(roomId, occ.id);
      await reload();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  }

  /* ---------- Export Excel (.xlsx) ---------- */
  function exportRoomExcel(room) {
    const meta = [
      ["Hôtel", room.hotel],
      ["Ville", room.city],
      ["Type", room.type],
      ["Capacité", String(room.capacity)],
      ["Occupés", String(room.occupants.length)],
      [],
      ["#", "Nom", "Passeport"],
    ];
    const rows = [
      ...meta,
      ...room.occupants.map((o, i) => [String(i + 1), o.name, o.passport || ""]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 28 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chambre");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const filename = `chambre_${slug(room.hotel)}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Impression de la chambre ---------- */
  function printRoom(room) {
    const html = renderPrintableRoomHTML(room);
    printHTMLWithIframe(html);
  }

  return (
    <div className="space-y-6 text-dyn">
      {/* En-tête clair */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Chambres</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">
          Gestion de l’hébergement des pèlerins {loading ? "· Chargement…" : ""}
        </p>
        {err ? <div className="text-rose-600 text-sm mt-1">{err}</div> : null}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="🏨" tone="sky"   label="Total chambres"   value={totalRooms} />
        <StatCard icon="👥" tone="indigo" label="Capacité totale" value={totalCapacity} />
        <StatCard icon="🧑‍🤝‍🧑" tone="sky" label="Occupés"       value={totalOccupied} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              📊
            </div>
            <div className="min-w-0 w-full">
              <div className="text-dyn-sm text-slate-600">Taux d’occupation</div>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900">{rate}%</div>
              <div className="mt-2">
                <Progress value={rate} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions globales */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          onClick={openCreateModal}
        >
          <span className="text-lg leading-none">＋</span> Nouvelle chambre
        </button>
      </div>

      {/* Cartes chambres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {rooms.map((room) => {
          const occ = room.occupants.length;
          const isFull = occ >= room.capacity;
          const roomRate = Math.round((occ / Math.max(1, room.capacity)) * 100);

          return (
            <section key={room.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{room.hotel}</h3>
                  <p className="text-slate-500">{room.city}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1 " +
                      (room.type === "double"
                        ? "bg-blue-50 text-blue-700 ring-blue-200"
                        : room.type === "triple"
                        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                        : "bg-sky-50 text-sky-700 ring-sky-200")
                    }
                  >
                    {room.type}
                  </span>
                  <button
                    onClick={() => openEditModal(room)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    title="Supprimer la chambre"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Occupation */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Occupation</span>
                  <span>{occ}/{room.capacity}</span>
                </div>
                <div className="mt-2">
                  <Progress value={roomRate} />
                </div>
              </div>

              {/* Occupants */}
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">Occupants</div>
                <div className="space-y-2">
                  {room.occupants.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-2 rounded-xl bg-slate-50 text-slate-800 px-3 py-2">
                      {o.photoUrl ? (
                        <img
                          src={o.photoUrl}
                          alt={o.name}
                          className="h-7 w-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {getInitials(o.name)}
                        </div>
                      )}
                      <span className="font-medium">{o.name}</span>
                      {o.passport ? (
                        <span className="text-slate-500 text-xs ml-auto">
                          Passeport: <span className="font-medium text-slate-700">{o.passport}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs ml-auto">—</span>
                      )}
                      <button
                        onClick={() => deleteOccupant(room.id, i)}
                        className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
                        title="Retirer cet occupant"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {!room.occupants.length && (
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500 text-sm">Aucun occupant</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isFull ? (
                  <button
                    disabled
                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400 cursor-not-allowed"
                  >
                    Chambre pleine
                  </button>
                ) : (
                  <button
                    onClick={() => openAssignModal(room)}
                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Affecter un pèlerin
                  </button>
                )}

                <button
                  onClick={() => exportRoomExcel(room)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Exporter (.xlsx)
                </button>
                <button
                  onClick={() => printRoom(room)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Imprimer la chambre
                </button>
              </div>
            </section>
          );
        })}
        {!loading && rooms.length === 0 && !err && (
          <div className="text-slate-500">Aucune chambre.</div>
        )}
      </div>

      {/* ============ MODALE CHAMBRE ============ */}
      {roomModalOpen && (
        <Modal
          title={editingRoomId ? "Modifier la chambre" : "Nouvelle chambre"}
          onClose={() => setRoomModalOpen(false)}
        >
          <form onSubmit={saveRoom} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Hôtel">
                <input
                  className="input"
                  value={form.hotel}
                  onChange={(e) => setForm({ ...form, hotel: e.target.value })}
                  placeholder="Al Safwa Hotel"
                  required
                />
              </Field>
              <Field label="Ville">
                <input
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Mecca"
                  required
                />
              </Field>
              <Field label="Type">
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="double">double</option>
                  <option value="triple">triple</option>
                  <option value="quadruple">quadruple</option>
                </select>
              </Field>
              <Field label="Capacité">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="2"
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-gray" onClick={() => setRoomModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-blue">
                {editingRoomId ? "Enregistrer" : "Créer la chambre"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============ MODALE AFFECTATION ============ */}
      {assignModalOpen && (
        <Modal title="Affecter un pèlerin" onClose={() => setAssignModalOpen(false)}>
          <form onSubmit={assignOccupant} className="space-y-3">
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

/* -------------------------------- UI bits -------------------------------- */

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
          <div className="text-dyn-sm text-slate-600">{label}</div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Progress({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
      <div className="h-2 bg-blue-600 transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-dyn-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify_between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
      <style>{`
        .input { @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-blue-300; }
        .btn-blue { @apply rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700; }
        .btn-gray { @apply rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50; }
      `}</style>
    </div>
  );
}

/* ------------------------------- Helpers --------------------------------- */

function normalizeRoomForm(f) {
  return {
    hotel: f.hotel.trim(),
    city: f.city.trim(),
    type: (f.type || "double").trim().toLowerCase(),
    capacity: Math.max(1, Number(f.capacity) || 1),
  };
}
function emptyRoomForm() {
  return { hotel: "", city: "", type: "double", capacity: "2" };
}
function slug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function getInitials(name) {
  const parts = String(name || "").split(/\s+/).filter(Boolean).slice(0, 2);
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

/* ----------- Impression HTML pour une chambre ----------- */
function renderPrintableRoomHTML(room) {
  const rows = room.occupants
    .map(
      (o, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="who">
          <div class="row">
            <div class="avatar">
              ${
                o.photoUrl
                  ? `<img src="${o.photoUrl}" alt="${escapeHtml(o.name)}"/>`
                  : `<div class="ph">${escapeHtml(getInitials(o.name))}</div>`
              }
            </div>
            <div>
              <div class="name">${escapeHtml(o.name)}</div>
              <div class="muted">Passeport: ${escapeHtml(o.passport || "—")}</div>
            </div>
          </div>
        </td>
      </tr>`
    )
    .join("");

  const occ = room.occupants.length;
  const rate = Math.round((occ / Math.max(1, room.capacity)) * 100);

  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>Chambre — ${escapeHtml(room.hotel)}</title>
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --blue:#2563eb; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--ink); margin: 24px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .muted { color: var(--muted); font-size: 12px; }
  .card { border:1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .row { display:flex; align-items:center; gap:12px; }
  .tag { display:inline-block; padding:6px 10px; background:#dbeafe; color:#1e40af; border-radius: 999px; font-weight:700; font-size:12px; }
  table { width:100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border-top:1px solid var(--line); padding: 10px; text-align: left; vertical-align: middle; }
  th { background:#f8fafc; }
  td:first-child, th:first-child { width: 48px; text-align:center; }
  .who .row { align-items: center; }
  .avatar { width:36px; height:36px; border-radius:999px; overflow:hidden; background:#f1f5f9; display:flex; align-items:center; justify-content:center; }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .ph { font-weight:700; color: var(--blue); }
  .header { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; }
  @media print { body { margin: 0; } .card { margin: 0 0 8mm; page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>${escapeHtml(room.hotel)} — ${escapeHtml(room.city)}</h1>
        <div class="muted">Type: ${escapeHtml(room.type)} — Capacité: ${room.capacity} — Occupés: ${occ} — Taux: ${rate}%</div>
      </div>
      <div class="tag">${occ}/${room.capacity}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Occupant</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="2" class="muted">Aucun occupant.</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

function printHTMLWithIframe(html) {
  try {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      border: 0,
      visibility: "hidden",
    });
    iframe.setAttribute("aria-hidden", "true");
    iframe.srcdoc = html;

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow;
        const doc = win?.document;
        if (!win || !doc) return cleanup();

        const imgs = Array.from(doc.images || []);
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((res) => { img.onload = img.onerror = res; })
          )
        );

        try { await doc.fonts?.ready; } catch {}

        win.focus?.();
        setTimeout(() => {
          try { win.print?.(); } catch {}
          setTimeout(cleanup, 800);
        }, 50);
      } catch {
        cleanup();
      }
    };

    document.body.appendChild(iframe);

    function cleanup() {
      try { document.body.removeChild(iframe); } catch {}
    }
  } catch (e) {
    console.error("Erreur impression:", e);
    alert("Impossible d’ouvrir l’impression. Vérifie les permissions du navigateur.");
  }
}
