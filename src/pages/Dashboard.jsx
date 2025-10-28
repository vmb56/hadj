// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ======================= Connexion API commune ======================= */
function getApiBase() {
  let viteUrl;
  try { viteUrl = typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL; } catch {}
  const craUrl =
    typeof process !== "undefined" &&
    process?.env &&
    (process.env.REACT_APP_API_URL || process.env.API_URL);

  const winUrl =
    typeof window !== "undefined" && typeof window.__API_URL__ !== "undefined"
      ? window.__API_URL__
      : undefined;

  let u = viteUrl || craUrl || winUrl || "http://localhost:4000";
  if (typeof u !== "string") u = String(u ?? "");
  return u.replace(/\/+$/, "");
}
const API_BASE = getApiBase();

const TOKEN_KEY = "bmvt_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
async function http(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    credentials: "include",
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ============================== API =============================== */
function normalizePayment(r = {}) {
  return {
    passeport: r.passeport ?? "",
    nom: r.nom ?? "",
    prenoms: r.prenoms ?? "",
    montant: Number(r.montant ?? r.montant_paye ?? 0),
    totalDu: Number(r.totalDu ?? r.total_du ?? 0),
    reduction: Number(r.reduction ?? 0),
    date: r.date ?? r.date_paiement ?? "",
    statut: r.statut ?? "",
    ref: r.ref ?? "",
  };
}
function normalizeVersement(r = {}) {
  return {
    passeport: r.passeport ?? "",
    nom: r.nom ?? "",
    prenoms: r.prenoms ?? "",
    echeance: r.echeance ?? r.date ?? "",
    verse: Number(r.verse ?? 0),
    restant: Number(r.restant ?? 0),
    statut: r.statut ?? "",
  };
}
async function apiGetPelerinsEtPaiements() {
  const data = await http(`${API_BASE}/api/pelerinspaiement`);
  const pelerins = Array.isArray(data?.pelerins) ? data.pelerins : [];
  const payments = (Array.isArray(data?.payments) ? data.payments : []).map(normalizePayment);
  // on ne garde que ceux avec passeport
  return { pelerins: pelerins.filter((x) => x?.passeport || x?.num_passeport), payments };
}
async function apiGetPaiements() {
  const data = await http(`${API_BASE}/api/paiements`);
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map(normalizePayment);
}
async function apiGetVersements() {
  // priorité: /api/versements ; fallback: /api/paiements/versements
  try {
    const data = await http(`${API_BASE}/api/versements`);
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(normalizeVersement);
  } catch {
    const data = await http(`${API_BASE}/api/paiements/versements`);
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(normalizeVersement);
  }
}
async function apiGetTotalDepenses() {
  // si tu as un endpoint dédié, sinon 0
  try {
    const d = await http(`${API_BASE}/api/depenses/total`);
    const total = Number(d?.total ?? 0);
    return Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

/* ======================= Agrégations / métriques ======================= */
function groupBy(arr, keyFn) {
  const m = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    m.set(k, (m.get(k) || []).concat(it));
  }
  return m;
}
function sum(arr, sel) {
  return arr.reduce((t, x) => t + Number(sel(x) || 0), 0);
}
function yyyymm(dateStr) {
  // "2025-10-28" -> "2025-10"
  const s = String(dateStr || "");
  return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : "";
}
function lastNMonthsLabels(n = 3) {
  const labels = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, mois: shortMonth(d) });
  }
  return labels;
}
function shortMonth(d) {
  return d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}
function buildRevenusVsDepenses(payments, depensesTotal) {
  // Agrège paiements par mois
  const byMonth = new Map(); // key=YYYY-MM -> sum
  for (const p of payments) {
    const key = yyyymm(p.date);
    if (!key) continue;
    byMonth.set(key, (byMonth.get(key) || 0) + Number(p.montant || 0));
  }
  // On prend les 3 derniers mois
  const months = lastNMonthsLabels(3);
  // Répartition des dépenses: si pas de détail, on met 0 partout (ou on répartit uniformément si tu préfères)
  const depensesByMonth = new Map();
  for (const m of months) depensesByMonth.set(m.key, 0);

  return months.map((m) => ({
    mois: m.mois,
    revenus: byMonth.get(m.key) || 0,
    depenses: depensesByMonth.get(m.key) || 0,
  }));
}
function computeStatusCounts(payments) {
  // Par passeport: somme montant et max(totalDu) pour savoir "complet" vs "partiel"
  const byPass = groupBy(payments, (p) => p.passeport || "");
  let complets = 0;
  let partiels = 0;
  for (const [, rows] of byPass) {
    const paid = sum(rows, (r) => r.montant);
    const maxTotalDu = Math.max(...rows.map((r) => Number(r.totalDu || 0)), 0);
    if (maxTotalDu > 0 && paid >= maxTotalDu) complets++;
    else if (paid > 0) partiels++;
  }
  return { complets, partiels };
}

/* ===================== Composant principal ===================== */
export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [state, setState] = useState({
    totalPelerins: 0,
    confirmes: 0,
    paiementsRecus: 0,
    depenses: 0,
    paiementsComplets: 0,
    paiementsPartiels: 0,
    occupation: { used: 0, total: 0 },
    revenusVsDepenses: [],
    statutPaiements: [],
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Charge en parallèle
        const [{ pelerins, payments: payFromPelerin }, payments, versements, depensesTotal] =
          await Promise.all([
            apiGetPelerinsEtPaiements(),
            apiGetPaiements(),
            apiGetVersements(),
            apiGetTotalDepenses(),
          ]);

        // Unifie la source paiements (priorité à /api/paiements)
        const allPayments = (Array.isArray(payments) && payments.length ? payments : payFromPelerin).map(
          normalizePayment
        );

        // total pelerins
        const totalPelerins = pelerins.length;

        // confirmés = ceux ayant payé > 0
        const paidByPass = groupBy(allPayments, (p) => p.passeport || "");
        let confirmes = 0;
        for (const [, rows] of paidByPass) {
          if (sum(rows, (r) => r.montant) > 0) confirmes++;
        }

        const paiementsRecus = sum(allPayments, (r) => r.montant);
        const depenses = Number(depensesTotal || 0);

        const { complets, partiels } = computeStatusCounts(allPayments);

        // occupation (à défaut d’API dédiée) : used = nb pelerins ; total = nb pelerins
        const occupation = { used: totalPelerins, total: totalPelerins || 1 };

        const revenusVsDepenses = buildRevenusVsDepenses(allPayments, depenses);

        const statutPaiements = [
          { label: "Complets", value: complets, color: "#16a34a" },
          { label: "Partiels", value: partiels, color: "#f59e0b" },
        ];

        setState({
          totalPelerins,
          confirmes,
          paiementsRecus,
          depenses,
          paiementsComplets: complets,
          paiementsPartiels: partiels,
          occupation,
          revenusVsDepenses,
          statutPaiements,
        });
      } catch (e) {
        setErr(e.message || "Impossible de charger le tableau de bord");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const {
    totalPelerins,
    confirmes,
    paiementsRecus,
    depenses,
    paiementsComplets,
    paiementsPartiels,
    occupation,
    revenusVsDepenses,
    statutPaiements,
  } = state;

  const solde = useMemo(() => (paiementsRecus || 0) - (depenses || 0), [paiementsRecus, depenses]);

  const tauxOcc = useMemo(() => {
    const pct = Math.round(((occupation?.used || 0) / Math.max(1, occupation?.total || 0)) * 100);
    return { pct, label: `${occupation?.used || 0}/${occupation?.total || 0}` };
  }, [occupation]);

  const pieTotal = useMemo(
    () => statutPaiements.reduce((s, x) => s + x.value, 0),
    [statutPaiements]
  );

  return (
    <div className="space-y-4 md:space-y-6 text-dyn">
      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-dyn-title font-extrabold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">Vue d’ensemble de la gestion du Hajj 2025</p>
        {loading && <div className="text-slate-500 text-xs mt-1">Chargement…</div>}
        {err && <div className="text-rose-600 text-xs mt-1">{err}</div>}
      </div>

      {/* LIGNE KPI PRINCIPALE */}
      <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          title="Total Pèlerins"
          value={totalPelerins}
          sub={`${confirmes} confirmé${confirmes > 1 ? "s" : ""}`}
          icon="👥"
          tone="blue"
        />
        <BigMoneyTile title="Paiements Reçus" amount={paiementsRecus} icon="💲" tone="indigo" />
        <BigMoneyTile title="Dépenses" amount={depenses} icon="📈" tone="rose" />
        <KpiTile
          title="Solde"
          value={formatCFA(solde)}
          strong
          icon="🧾"
          tone={solde >= 0 ? "emerald" : "rose"}
        />
      </section>

      {/* BANDE KPI SECONDAIRE */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <SoftTile title="Paiements Complets" value={paiementsComplets} icon="✅" tone="emerald" />
        <SoftTile title="Paiements Partiels" value={paiementsPartiels} icon="⏲️" tone="amber" />
        <SoftTile
          title="Occupation Chambres"
          value={tauxOcc.label}
          right={<Progress value={tauxOcc.pct} tone="blue" />}
          icon="🏨"
          tone="sky"
        />
      </section>

      {/* ZONE GRAPHIQUES */}
      <section className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <Card title="Revenus vs Dépenses">
          <BarChart
            data={revenusVsDepenses}
            maxY={guessNiceMax(revenusVsDepenses)}
            series={[
              { key: "revenus", label: "Revenus", color: "#2563eb" }, // blue-600
              { key: "depenses", label: "Dépenses", color: "#7c3aed" }, // violet-600
            ]}
          />
        </Card>

        <Card title="Statut des Paiements">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(160px,240px)_1fr] items-center">
            <div className="w-full">
              <PieChart data={statutPaiements} total={pieTotal} />
            </div>
            <ul className="space-y-2">
              {statutPaiements.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-dyn-sm">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-700">{s.label}</span>
                  <span className="ml-auto font-semibold text-slate-900">{pct(s.value, pieTotal)}%</span>
                </li>
              ))}
              {!statutPaiements.length && <li className="text-slate-500">Aucune donnée</li>}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ================= UI BLOCKS ================= */
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-200 text-dyn-sm font-extrabold">
        {title}
      </div>
      {children}
    </div>
  );
}
function KpiTile({ title, value, sub, icon, tone = "blue", strong = false }) {
  const toneMap =
    {
      blue: { chip: "bg-blue-50 ring-blue-200", num: "text-blue-700" },
      indigo: { chip: "bg-indigo-50 ring-indigo-200", num: "text-indigo-700" },
      sky: { chip: "bg-sky-50 ring-sky-200", num: "text-sky-700" },
      emerald: { chip: "bg-emerald-50 ring-emerald-200", num: "text-emerald-700" },
      rose: { chip: "bg-rose-50 ring-rose-200", num: "text-rose-700" },
    }[tone] || { chip: "bg-slate-50 ring-slate-200", num: "text-slate-700" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{title}</div>
          <div className={`mt-1 ${strong ? "text-3xl" : "text-2xl"} font-extrabold ${toneMap.num}`}>
            {value}
          </div>
          {sub ? <div className="text-dyn-sm text-slate-500 mt-1">{sub}</div> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap.chip} ring-1`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}
function BigMoneyTile({ title, amount, icon, tone = "indigo" }) {
  const toneMap =
    {
      indigo: { chip: "bg-indigo-50 ring-indigo-200" },
      rose: { chip: "bg-rose-50 ring-rose-200" },
    }[tone] || { chip: "bg-slate-50 ring-slate-200" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-600">{title}</div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">
            {formatCFA(amount)}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap.chip} ring-1`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}
function SoftTile({ title, value, icon, tone = "blue", right = null }) {
  const toneMap =
    {
      blue: { box: "bg-blue-50 ring-blue-200", txt: "text-blue-700" },
      indigo: { box: "bg-indigo-50 ring-indigo-200", txt: "text-indigo-700" },
      sky: { box: "bg-sky-50 ring-sky-200", txt: "text-sky-700" },
      emerald: { box: "bg-emerald-50 ring-emerald-200", txt: "text-emerald-700" },
      amber: { box: "bg-amber-50 ring-amber-200", txt: "text-amber-700" },
    }[tone] || { box: "bg-slate-50 ring-slate-200", txt: "text-slate-700" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-dyn-sm text-slate-600">{title}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
        <div className="flex items-center gap-3">
          {right}
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap.box} ring-1 ${toneMap.txt}`}>
            <span className="text-lg">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Progress ---------- */
function Progress({ value = 0, tone = "blue" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const bar =
    {
      blue: "bg-blue-600",
      indigo: "bg-indigo-600",
      sky: "bg-sky-600",
      emerald: "bg-emerald-600",
    }[tone] || "bg-blue-600";
  return (
    <div className="w-24 sm:w-28">
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-2 ${bar}`} style={{ width: `${v}%` }} />
      </div>
      <div className="text-[11px] text-right text-slate-500 mt-1">{v}%</div>
    </div>
  );
}

/* ---------- Hook utilitaire pour taille conteneur ---------- */
function useContainerSize() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(320, Math.floor(e.contentRect.width)));
    });
    ro.observe(el);
    setW(Math.max(320, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ---------- BarChart (responsive, sans lib) ---------- */
function BarChart({ data = [], maxY, series }) {
  const [wrapRef, width] = useContainerSize();
  const W = width;
  const H = Math.max(220, Math.round(W * 0.42));

  const padding = { t: 20, r: 16, b: 28, l: 56 };
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;

  const maxVal = Math.max(
    maxY || 0,
    ...data.flatMap((d) => series.map((s) => d[s.key] || 0)),
    1
  );
  const yScale = (v) => innerH - (v / maxVal) * innerH;

  const groupWidth = innerW / Math.max(1, data.length);
  const barWidth = (groupWidth * 0.6) / series.length;

  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((maxVal / 5) * i));

  return (
    <div ref={wrapRef} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
        <rect x="0" y="0" width={W} height={H} fill="#ffffff" rx="12" />
        {/* Grille */}
        {ticks.map((t, i) => {
          const y = padding.t + yScale(t);
          return (
            <g key={i}>
              <line x1={padding.l} x2={W - padding.r} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
              <text x={padding.l - 8} y={y + 4} fontSize="10" textAnchor="end" fill="#64748b">
                {formatCompact(t)}
              </text>
            </g>
          );
        })}

        {/* Barres */}
        {data.map((d, i) => {
          const x0 = padding.l + groupWidth * i + groupWidth * 0.2;
          return (
            <g key={i}>
              {series.map((s, j) => {
                const val = d[s.key] || 0;
                const h = innerH - yScale(val);
                const x = x0 + j * barWidth;
                const y = padding.t + yScale(val);
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={Math.max(1, barWidth - 2)}
                    height={h}
                    rx="6"
                    fill={s.color}
                    opacity={0.9}
                  />
                );
              })}
              {/* Label X */}
              <text
                x={padding.l + groupWidth * i + groupWidth / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
              >
                {d.mois}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="mt-2 flex flex-wrap gap-3 text-dyn-sm">
        {series.map((s) => (
          <div key={s.key} className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="text-slate-700">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- PieChart (responsive, sans lib) ---------- */
function PieChart({ data = [], total = 0 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(220);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setSize(Math.max(160, Math.min(280, Math.round(w))));
      }
    });
    ro.observe(el);
    setSize(Math.max(160, Math.min(280, Math.round(el.clientWidth))));
    return () => ro.disconnect();
  }, []);

  const r = size / 2;
  const cx = r, cy = r;

  let angle = -Math.PI / 2;
  const arcs = data.map((d) => {
    const ratio = total ? d.value / total : 0;
    const a2 = angle + ratio * Math.PI * 2;
    const path = arcPath(cx, cy, r - 10, angle, a2);
    angle = a2;
    return { ...d, path };
  });

  return (
    <div ref={ref} className="w-full" style={{ aspectRatio: "1/1" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
        <circle cx={cx} cy={cy} r={r - 10} fill="#f8fafc" />
        {arcs.map((a) => <path key={a.label} d={a.path} fill={a.color} />)}
      </svg>
    </div>
  );
}

/* ================= Helpers ================= */
function formatCFA(n) {
  const abs = Math.abs(n || 0);
  const s = new Intl.NumberFormat("fr-FR").format(abs) + " FCFA";
  return n < 0 ? "-" + s : s;
}
function pct(n, total) { if (!total) return 0; return Math.round((n * 1000) / total) / 10; }
function formatCompact(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
function guessNiceMax(rows) {
  const m = Math.max(1, ...rows.map((r) => Math.max(r.revenus || 0, r.depenses || 0)));
  const step = 500_000;
  return Math.ceil(m / step) * step;
}
function arcPath(cx, cy, r, a1, a2) {
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}
