// src/layouts/MainLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Stethoscope,
  Wallet,
  Plane,
  FileText,
  Settings,
  UserCircle2,
  Printer,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  LayoutDashboard,
  Search,
} from "lucide-react";

/** ==== Thème : Bleu profond & gris doux ====
 * - Sidebar : gradient bleu foncé + effet verre
 * - Contenu : gris clair (slate-100) — moins clair que blanc
 * - Typo dynamique : base 16px + contrôle A−/A+
 */
const APP_GRADIENT = "bg-gradient-to-b from-blue-800 via-blue-700 to-blue-600";
const SIDEBAR_CHROME =
  "backdrop-blur-md border-r border-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";
const CONTENT_BG = "bg-slate-100";

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 font-semibold outline-none transition-all";
const linkIdle =
  "text-white/90 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40";
const linkActive =
  "text-blue-700 bg-white shadow ring-2 ring-blue-300";

/** Petite barre d’accent à gauche */
function ActiveAccent() {
  return (
    <span className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[4px] rounded-full bg-white/90 shadow shadow-black/10 transition-all duration-300 group-[.active]:opacity-100 opacity-0" />
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  /** ====== Taille de police dynamique (A− / A+) ======
   * fontStep ∈ [-2 … 3]  → base = 16 + 2*step  → 12px à 22px
   * Persistée en localStorage
   */
  const [fontStep, setFontStep] = useState(() => {
    const v = Number(localStorage.getItem("app_font_step") || "0");
    return Math.max(-2, Math.min(3, v));
  });
  useEffect(() => {
    localStorage.setItem("app_font_step", String(fontStep));
  }, [fontStep]);
  const baseFont = 16 + fontStep * 2; // px

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [mobileOpen]);

  const sbWidthClass = collapsed ? "md:ml-[80px]" : "md:ml-72";

  const pageTitle = useMemo(() => {
    const p = pathname.replace(/^\/+/, "");
    if (!p) return "Tableau de bord";
    return p
      .split(/[/-]+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }, [pathname]);

  return (
    <div
      className={`w-full ${CONTENT_BG}`}
      style={{ minHeight: "100vh", ["--app-fs"]: `${baseFont}px` }}
    >
      {/* Variables & utilitaires pour la taille dynamique */}
      <style>{`
        /* Classes dynamiques basées sur --app-fs */
        .text-dyn        { font-size: var(--app-fs); line-height: 1.6; }
        .text-dyn-sm     { font-size: calc(var(--app-fs) - 2px); line-height: 1.5; }
        .text-dyn-xs     { font-size: calc(var(--app-fs) - 3px); line-height: 1.45; }
        .text-dyn-lg     { font-size: calc(var(--app-fs) + 2px); line-height: 1.6; }
        .text-dyn-title  { font-size: calc(var(--app-fs) + 4px); line-height: 1.4; font-weight: 700; }
        .text-dyn-brand  { font-size: calc(var(--app-fs) + 3px); line-height: 1.3; font-weight: 800; }
        .icon-dyn        { width: calc(var(--app-fs) + 4px); height: calc(var(--app-fs) + 4px); }
        .icon-dyn-sm     { width: calc(var(--app-fs) + 2px); height: calc(var(--app-fs) + 2px); }

        /* Boutons A− / A+ */
        .btn-chips {
          @apply rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50;
        }
      `}</style>

      {/* ==== Sidebar ==== */}
      <aside
        className={[
          "hidden md:flex fixed left-0 top-0 h-screen flex-col transition-[width] duration-300 z-40",
          collapsed ? "w-[80px]" : "w-72",
          APP_GRADIENT,
          SIDEBAR_CHROME,
        ].join(" ")}
      >
        {/* Logo + bouton collapse */}
        <div className="relative px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
              <LayoutGrid className="text-white icon-dyn-sm" />
            </div>
            {!collapsed && (
              <div className="text-white drop-shadow-sm text-dyn-brand">
                BMVT HADJ & OUMRA
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md border border-white/20 p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            title={collapsed ? "Étendre" : "Réduire"}
          >
            {collapsed ? (
              <ChevronRight className="text-white icon-dyn-sm" />
            ) : (
              <ChevronLeft className="text-white icon-dyn-sm" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <Section title="Tableau de bord" collapsed={collapsed}>
            <Item to="/tableau-de-bord" icon  ={LayoutDashboard} label="Tableau de bord" collapsed={collapsed}/>
          </Section>

          
          <Section title="Pèlerins" collapsed={collapsed}>
            <Item to="/pelerins" icon={Users} label="Ajouter / Liste" collapsed={collapsed} />
            <Item to="/Impressions-Pelerins" icon={Printer} label="Impression fiche" collapsed={collapsed} />
            <Item to="/stats-pelerins" icon={BarChart3} label="Statistiques" collapsed={collapsed} />
             

          </Section>

          <Section title="Médicale" collapsed={collapsed}>
            <Item to="/medicale" icon={Stethoscope} label="Suivi médical" collapsed={collapsed} />
          </Section>

          <Section title="Paiement" collapsed={collapsed}>
            <Item to="/paiement" icon={Wallet} label="Règlements & échéances" collapsed={collapsed} />
            <Item to="/factures" icon={FileText} label="Factures" collapsed={collapsed} />
          </Section>

          <Section title="Voyage" collapsed={collapsed}>
            <Item to="/voyage" icon={Plane} label="Vols & Chambres" collapsed={collapsed} />
          </Section>

          <Section title="Utilisateurs" collapsed={collapsed}>
            <Item to="/utilisateurs" icon={UserCircle2} label="Comptes" collapsed={collapsed} />
            <Item to="/settings" icon={Settings} label="Paramètres" collapsed={collapsed} />
          </Section>

          <Section title="Impressions" collapsed={collapsed}>
            <Item to="/impressions-passeports" icon={Printer} label="Photos / Passeport" collapsed={collapsed} />
          </Section>
        </nav>

        {/* Pied sidebar */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3">
            <img
              src={"https://api.dicebear.com/7.x/initials/svg?seed=BMVT&backgroundType=gradientLinear"}
              alt="Org"
              className="h-9 w-9 rounded-full ring-2 ring-white/30 object-cover"
            />
            {!collapsed && (
              <div>
                <div className="text-white/95 text-dyn-sm font-semibold">
                  Espace BMVT
                </div>
                <div className="text-white/70 text-dyn-xs">v1.0 • stable</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ==== Contenu principal ==== */}
      <div className={`min-w-0 ${sbWidthClass} flex flex-col`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 h-[70px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300 md:hidden"
              >
                <Menu className="text-blue-700 icon-dyn" />
              </button>
              <div className="text-slate-800 hidden md:block text-dyn-title">
                {pageTitle}
              </div>
            </div>

            {/* Recherche */}
            <div className="hidden md:flex items-center w-[460px]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 icon-dyn-sm" />
                <input
                  type="search"
                  placeholder="Rechercher…"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 py-2.5 text-dyn outline-none ring-2 ring-transparent focus:ring-blue-300 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Actions (incl. A− / A+) */}
            <div className="flex items-center gap-2">
              <button
                className="btn-chips"
                onClick={() => setFontStep((s) => Math.max(-2, s - 1))}
                title="Réduire la taille du texte"
              >
                <span className="text-dyn-sm">A−</span>
              </button>
              <button
                className="btn-chips"
                onClick={() => setFontStep((s) => Math.min(3, s + 1))}
                title="Augmenter la taille du texte"
              >
                <span className="text-dyn-sm">A+</span>
              </button>

              <div className="h-8 w-[1px] bg-slate-200 mx-1" />

              <button className="btn-chips" title="Notifications">
                <Bell className="icon-dyn-sm" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                <img
                  src={"https://api.dicebear.com/7.x/initials/svg?seed=Valy%20Bamba&backgroundType=gradientLinear"}
                  alt="Valy Bamba"
                  className="rounded-full ring-1 ring-slate-200 object-cover"
                  style={{ width: `calc(var(--app-fs) + 10px)`, height: `calc(var(--app-fs) + 10px)` }}
                />
                <div className="hidden sm:block">
                  <div className="text-slate-800 font-semibold text-dyn-sm">Valy Bamba</div>
                  <div className="text-slate-500 text-dyn-xs">Administrateur</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Drawer Mobile */}
        <div
          className={[
            "fixed inset-0 z-50 md:hidden pointer-events-none",
            mobileOpen ? "pointer-events-auto" : "",
          ].join(" ")}
          aria-hidden={!mobileOpen}
        >
          <div
            className={[
              "absolute inset-0 bg-black/50 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={[
              "absolute left-0 top-0 h-full w-[82%] max-w-[320px]",
              APP_GRADIENT,
              SIDEBAR_CHROME,
              "shadow-2xl will-change-transform transform transition-transform duration-300 ease-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            style={{ ["--app-fs"]: `${baseFont}px` }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <LayoutGrid className="text-white icon-dyn-sm" />
                <div className="text-white text-dyn-brand">BMVT HADJ & OUMRA</div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Fermer le menu"
              >
                <X className="text-white icon-dyn-sm" />
              </button>
            </div>

            <nav className="p-3 space-y-5 overflow-y-auto h-[calc(100%-56px)]">
              <MobileGroup title="Pèlerins">
                <MobileItem to="/pelerins" icon={Users} label="Ajouter / Liste" />
                <MobileItem to="/impression-pelerins" icon={Printer} label="Impression fiche" />
                <MobileItem to="/stats-pelerins" icon={BarChart3} label="Statistiques" />
              </MobileGroup>
              <MobileGroup title="Médicale">
                <MobileItem to="/medicale" icon={Stethoscope} label="Suivi médical" />
              </MobileGroup>
              <MobileGroup title="Paiement">
                <MobileItem to="/paiement" icon={Wallet} label="Règlements & échéances" />
                <MobileItem to="/factures" icon={FileText} label="Factures" />
              </MobileGroup>
              <MobileGroup title="Voyage">
                <MobileItem to="/voyage" icon={Plane} label="Vols & Chambres" />
              </MobileGroup>
              <MobileGroup title="Utilisateurs">
                <MobileItem to="/utilisateurs" icon={UserCircle2} label="Comptes" />
                <MobileItem to="/settings" icon={Settings} label="Paramètres" />
              </MobileGroup>
              <MobileGroup title="Impressions">
                <MobileItem to="/impressions-passeports" icon={Printer} label="Photos / Passeport" />
              </MobileGroup>
            </nav>
          </aside>
        </div>

        {/* Zone pages (tout le contenu hérite de --app-fs) */}
        <main className="min-w-0 h-[calc(100vh-70px)] overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-5 md:p-7 lg:p-9 text-slate-900 text-dyn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---- Sous-composants ---- */
function Section({ title, children, collapsed }) {
  if (collapsed) return <div className="space-y-2">{children}</div>;
  return (
    <div>
      <div className="mb-2 select-none rounded-md border border-white/15 bg-white/10 px-2 py-1 text-white/95 shadow-inner text-dyn-xs font-extrabold uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Item({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          linkBase,
          isActive ? "active " + linkActive : linkIdle,
          "focus-visible:outline-none relative",
          "text-dyn", // ← taille adaptative
        ].join(" ")
      }
    >
      <ActiveAccent />
      <Icon className="text-white group-[.active]:text-blue-700 icon-dyn-sm" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-blue-700 px-2 py-1 text-white shadow-lg opacity-0 group-hover:opacity-100 text-dyn-xs">
          {label}
        </span>
      )}
    </NavLink>
  );
}

function MobileGroup({ title, children }) {
  return (
    <div>
      <div className="mb-1 text-white/90 text-dyn-xs font-black uppercase tracking-widest">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function MobileItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition text-dyn
         ${isActive ? "bg-white/15 text-white ring-2 ring-white/40" : "text-white/90 hover:bg-white/10"}`
      }
    >
      <Icon className="text-white icon-dyn-sm" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
