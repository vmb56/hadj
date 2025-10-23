// src/pages/Dashboard.jsx
import React, { useMemo } from "react";

/* =========================
   Données de démonstration
   (branche plus tard ton API)
   ========================= */
const SAMPLE = {
  totalPelerins: 3,
  confirmes: 2,
  paiementsRecus: 5_500_000,
  depenses: 14_200_000,
  paiementsComplets: 1,
  paiementsPartiels: 2,
  occupation: { used: 3, total: 5 },
  revenusVsDepenses: [
    { mois: "Nov", revenus: 4_500_000, depenses: 3_000_000 },
    { mois: "Déc", revenus: 5_000_000, depenses: 4_200_000 },
    { mois: "Jan", revenus: 0,         depenses: 0 },
  ],
  statutPaiements: [
    { label: "Complets", value: 1, color: "#16a34a" },
    { label: "Partiels", value: 2, color: "#f59e0b" },
  ],
};

export default function Dashboard({ data = SAMPLE }) {
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
  } = data;

  const solde = useMemo(() => (paiementsRecus || 0) - (depenses || 0), [paiementsRecus, depenses]);
  const tauxOcc = useMemo(() => {
    const pct = Math.round(((occupation?.used || 0) / Math.max(1, occupation?.total || 0)) * 100);
    return { pct, label: `${occupation?.used || 0}/${occupation?.total || 0}` };
  }, [occupation]);

  const pieTotal = useMemo(() => statutPaiements.reduce((s, x) => s + x.value, 0), [statutPaiements]);

  return (
    <div className="space-y-6 text-dyn">
      {/* HEADER (clair) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-dyn-title font-extrabold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-dyn-sm text-slate-600">Vue d’ensemble de la gestion du Hajj 2025</p>
      </div>

      {/* LIGNE KPI PRINCIPALE */}
      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <KpiTile
          title="Total Pèlerins"
          value={totalPelerins}
          sub={`${confirmes} confirmé${confirmes > 1 ? "s" : ""}`}
          icon="👥"
          tone="blue"
        />
        <BigMoneyTile
          title="Paiements Reçus"
          amount={paiementsRecus}
          icon="💲"
          tone="indigo"
        />
        <BigMoneyTile
          title="Dépenses"
          amount={depenses}
          icon="📈"
          tone="rose"
        />
        <KpiTile
          title="Solde"
          value={formatCFA(solde)}
          strong
          icon="🧾"
          tone={solde >= 0 ? "emerald" : "rose"}
        />
      </section>

      {/* BANDE KPI SECONDAIRE */}
      <section className="grid gap-4 lg:grid-cols-3">
        <SoftTile
          title="Paiements Complets"
          value={paiementsComplets}
          icon="✅"
          tone="emerald"
        />
        <SoftTile
          title="Paiements Partiels"
          value={paiementsPartiels}
          icon="⏲️"
          tone="amber"
        />
        <SoftTile
          title="Occupation Chambres"
          value={tauxOcc.label}
          right={<Progress value={tauxOcc.pct} tone="blue" />}
          icon="🏨"
          tone="sky"
        />
      </section>

      {/* ZONE GRAPHIQUES */}
      <section className="grid gap-4 xl:grid-cols-2">
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
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-center">
            <PieChart data={statutPaiements} total={pieTotal} />
            <ul className="space-y-2">
              {statutPaiements.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-dyn-sm">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-slate-700">{s.label}</span>
                  <span className="ml-auto font-semibold text-slate-900">
                    {pct(s.value, pieTotal)}%
                  </span>
                </li>
              ))}
              {!statutPaiements.length && (
                <li className="text-slate-500">Aucune donnée</li>
              )}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ================= UI BLOCKS (thème Medicale) ================= */

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
  const toneMap = {
    blue:    { chip: "bg-blue-50 ring-blue-200",     num: "text-blue-700" },
    indigo:  { chip: "bg-indigo-50 ring-indigo-200", num: "text-indigo-700" },
    sky:     { chip: "bg-sky-50 ring-sky-200",       num: "text-sky-700" },
    emerald: { chip: "bg-emerald-50 ring-emerald-200", num: "text-emerald-700" },
    rose:    { chip: "bg-rose-50 ring-rose-200",     num: "text-rose-700" },
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
  const toneMap = {
    indigo: { chip: "bg-indigo-50 ring-indigo-200" },
    rose:   { chip: "bg-rose-50 ring-rose-200" },
  }[tone] || { chip: "bg-slate-50 ring-slate-200" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-600">{title}</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{formatCFA(amount)}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap.chip} ring-1`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function SoftTile({ title, value, icon, tone = "blue", right = null }) {
  const toneMap = {
    blue:    { box: "bg-blue-50 ring-blue-200",       txt: "text-blue-700" },
    indigo:  { box: "bg-indigo-50 ring-indigo-200",   txt: "text-indigo-700" },
    sky:     { box: "bg-sky-50 ring-sky-200",         txt: "text-sky-700" },
    emerald: { box: "bg-emerald-50 ring-emerald-200", txt: "text-emerald-700" },
    amber:   { box: "bg-amber-50 ring-amber-200",     txt: "text-amber-700" },
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

/* ---------- Progress (barre fine, thème bleu) ---------- */
function Progress({ value = 0, tone = "blue" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const bar = {
    blue: "bg-blue-600",
    indigo: "bg-indigo-600",
    sky: "bg-sky-600",
    emerald: "bg-emerald-600",
  }[tone] || "bg-blue-600";
  return (
    <div className="w-28">
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-2 ${bar}`} style={{ width: `${v}%` }} />
      </div>
      <div className="text-[11px] text-right text-slate-500 mt-1">{v}%</div>
    </div>
  );
}

/* ---------- BarChart (SVG, sans lib) ---------- */
function BarChart({ data = [], maxY, series }) {
  const padding = { t: 20, r: 16, b: 28, l: 60 };
  const W = 680, H = 280;
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
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[620px]">
        {/* fond blanc / radios */}
        <rect x="0" y="0" width={W} height={H} fill="#ffffff" rx="12" />
        {/* grid horizontale */}
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

        {/* barres */}
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
                    width={barWidth - 2}
                    height={h}
                    rx="6"
                    fill={s.color}
                    opacity={0.9}
                  />
                );
              })}
              {/* label X */}
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
      <div className="mt-2 flex gap-4 text-dyn-sm">
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

/* ---------- PieChart (SVG, sans lib) ---------- */
function PieChart({ data = [], total = 0, size = 220 }) {
  const r = size / 2;
  const cx = r, cy = r;

  let angle = -Math.PI / 2; // démarrer en haut
  const arcs = data.map((d) => {
    const ratio = total ? d.value / total : 0;
    const a2 = angle + ratio * Math.PI * 2;
    const path = arcPath(cx, cy, r - 10, angle, a2);
    angle = a2;
    return { ...d, path };
  });

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r - 10} fill="#f8fafc" />
      {arcs.map((a) => (
        <g key={a.label}>
          <path d={a.path} fill={a.color} />
        </g>
      ))}
    </svg>
  );
}

/* ================= Helpers ================= */
function formatCFA(n) {
  const abs = Math.abs(n || 0);
  const s = new Intl.NumberFormat("fr-FR").format(abs) + " FCFA";
  return n < 0 ? "-" + s : s;
}
function pct(n, total) {
  if (!total) return 0;
  return Math.round((n * 1000) / total) / 10;
}
function formatCompact(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
function guessNiceMax(rows) {
  const m = Math.max(
    1,
    ...rows.map((r) => Math.max(r.revenus || 0, r.depenses || 0))
  );
  const step = 500_000;
  return Math.ceil(m / step) * step;
}
function arcPath(cx, cy, r, a1, a2) {
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}
