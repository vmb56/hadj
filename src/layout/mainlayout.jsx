// src/layout/mainlayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import LogoutButton from "../components/LogoutButton.jsx";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Wallet,
  Plane,
  FileText,
  List,
  UserCircle2,
  Printer,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Sun,
  Moon,
  HandCoins,
  House,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

// 🎯 Logo entreprise
import Logo from "../pages/pelerins/Logo.png";

/** Thème clair / sombre */
const APP_GRADIENT_LIGHT =
  "bg-gradient-to-b from-blue-800 via-blue-700 to-blue-600";
const CONTENT_BG_LIGHT = "bg-slate-100";
const APP_GRADIENT_DARK =
  "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700";
const CONTENT_BG_DARK = "bg-slate-900";

/** Chrome latéral (verre) */
const SIDEBAR_CHROME =
  "backdrop-blur-md border-r border-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";

/** Liens sidebar */
const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 font-semibold outline-none transition-all duration-200 will-change-transform";
const linkIdle =
  "text-white/90 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40";
const linkActive = "text-blue-700 bg-white shadow ring-2 ring-blue-300";

/** Petite barre d’accent à gauche */
function ActiveAccent() {
  return (
    <span className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-[4px] rounded-full bg-white/90 shadow shadow-black/10 transition-all duration-300 group-[.active]:opacity-100 opacity-0" />
  );
}

export default function MainLayout() {
  const authUser = useAuthUser();

  // === Infos utilisateur connecté ===
  const fullName =
    authUser?.name?.trim() ||
    authUser?.email?.split("@")[0] ||
    "Utilisateur";

  const roleLabel = authUser?.role || "—";
  const role = (authUser?.role || "").toLowerCase();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  /** ====== Thème ====== */
  const [theme, setTheme] = useState(() => {
    const v = localStorage.getItem("app_theme") || "light";
    return v === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("app-dark");
    else root.classList.remove("app-dark");
  }, [theme]);

  const isDark = theme === "dark";
  const APP_GRADIENT = isDark ? APP_GRADIENT_DARK : APP_GRADIENT_LIGHT;
  const CONTENT_BG = isDark ? CONTENT_BG_DARK : CONTENT_BG_LIGHT;

  /** ====== Base font ====== */
  const baseFont = 16;

  // Fermer drawer mobile au changement de route
  useEffect(() => setMobileOpen(false), [pathname]);

  // Bloquer scroll body quand menu mobile ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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

  /** ====== Permissions par rôle ====== */
  const isAdmin = role === "admin";
  const isAgent = role === "agent";
  const isSuperviseur = role === "superviseur";

  function canSee(key) {
    if (isAdmin) return true;
    if (isAgent) {
      if (key === "dashboard") return false;
      if (key === "comptes") return false;
      return true;
    }
    if (isSuperviseur) {
      if (key === "comptes") return false;
      return true;
    }
    if (key === "comptes") return false;
    return true;
  }

  // Style dynamique badge rôle
  const roleBadgeClass = (() => {
    if (role === "admin") {
      return isDark
        ? "bg-rose-500/20 text-rose-100 border border-rose-500/60"
        : "bg-rose-50 text-rose-700 border border-rose-200";
    }
    if (role === "superviseur") {
      return isDark
        ? "bg-violet-500/20 text-violet-100 border border-violet-500/60"
        : "bg-violet-50 text-violet-700 border border-violet-200";
    }
    if (role === "agent") {
      return isDark
        ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/60"
        : "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }
    return isDark
      ? "bg-blue-500/20 text-blue-100 border border-blue-500/60"
      : "bg-blue-50 text-blue-700 border border-blue-200";
  })();

  return (
    <div
      className={`w-full ${CONTENT_BG}`}
      style={{ minHeight: "100vh", ["--app-fs"]: `${baseFont}px` }}
    >
      {/* Variables & utilitaires */}
      <style>{`
        .text-dyn        { font-size: var(--app-fs); line-height: 1.6; }
        .text-dyn-sm     { font-size: calc(var(--app-fs) - 2px); line-height: 1.5; }
        .text-dyn-xs     { font-size: calc(var(--app-fs) - 3px); line-height: 1.45; }
        .text-dyn-lg     { font-size: calc(var(--app-fs) + 2px); line-height: 1.6; }
        .text-dyn-title  { font-size: calc(var(--app-fs) + 4px); line-height: 1.4; font-weight: 700; }
        .text-dyn-brand  { font-size: calc(var(--app-fs) + 3px); line-height: 1.3; font-weight: 800; }
        .icon-dyn        { width: calc(var(--app-fs) + 4px); height: calc(var(--app-fs) + 4px); }
        .icon-dyn-sm     { width: calc(var(--app-fs) + 2px); height: calc(var(--app-fs) + 2px); }

        .btn-chips { 
          @apply rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 
                 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 
                 active:translate-y-0 active:scale-[.98];
        }

        .app-dark .text-topbar { color: #e5e7eb; }
        .app-dark .panel-card { @apply bg-slate-800 border-slate-700 text-slate-100; }
        .app-dark .panel-border { @apply border-slate-700; }

        @keyframes shine {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        .shine-on-hover { position: relative; overflow: hidden; }
        .shine-on-hover::after {
          content:""; position:absolute; inset:-2px; width:40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: translateX(-120%);
        }
        .shine-on-hover:hover::after { animation: shine .9s ease; }
      `}</style>

      {/* ==== Sidebar desktop ==== */}
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white/90 flex items-center justify-center ring-1 ring-white/60 overflow-hidden shadow-sm shrink-0">
              <img src={Logo} alt="Logo BMVT" className="h-8 w-8 object-contain" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-white drop-shadow-sm text-dyn-brand truncate">
                  BMVT HADJ &amp; OUMRA
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/70 truncate">
                  Bakayoko Mawa Voyages &amp; Tourismes
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md border border-white/20 p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            title={collapsed ? "Étendre" : "Réduire"}
          >
            {collapsed ? (
              <ChevronRight className="text-white icon-dyn-sm" />
            ) : (
              <ChevronLeft className="text-white icon-dyn-sm" />
            )}
          </button>
        </div>

        {/* Navigation desktop */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {canSee("dashboard") && (
            <Section title="Tableau de bord" collapsed={collapsed}>
              <Item
                to="/tableau-de-bord"
                icon={LayoutDashboard}
                label="Tableau de bord"
                collapsed={collapsed}
              />
            </Section>
          )}

          <Section title="Pèlerins" collapsed={collapsed}>
            <Item
              to="/pelerins"
              icon={Users}
              label="Ajouter / Liste"
              collapsed={collapsed}
            />
            <Item
              to="/Impressions-Pelerins"
              icon={Printer}
              label="Impression fiche"
              collapsed={collapsed}
            />
            <Item
              to="/stats-pelerins"
              icon={BarChart3}
              label="Statistiques"
              collapsed={collapsed}
            />
            <Item
              to="/listes-pelerins"
              icon={List}
              label="Lists-pelerins"
              collapsed={collapsed}
            />
          </Section>

          <Section title="Médicale" collapsed={collapsed}>
            <Item
              to="/medicale"
              icon={Stethoscope}
              label="Suivi médical"
              collapsed={collapsed}
            />
          </Section>

          <Section title="Offres" collapsed={collapsed}>
            <Item
              to="/Enregistrement_Offres"
              icon={HandCoins}
              label="Enregistrement Des Offres"
              collapsed={collapsed}
            />
          </Section>

          <Section title="Paiement" collapsed={collapsed}>
            <Item
              to="/paiement"
              icon={Wallet}
              label="Règlements & échéances"
              collapsed={collapsed}
            />
            <Item
              to="/factures"
              icon={FileText}
              label="Factures"
              collapsed={collapsed}
            />
          </Section>

          <Section title="Voyage" collapsed={collapsed}>
            <Item
              to="/voyages"
              icon={Plane}
              label="Voyages"
              collapsed={collapsed}
            />
            <Item
              to="/voyage"
              icon={Plane}
              label="Vols & Chambres"
              collapsed={collapsed}
            />
          </Section>

          <Section title="Utilisateurs" collapsed={collapsed}>
            {canSee("comptes") && (
              <Item
                to="/utilisateurs"
                icon={UserCircle2}
                label="Comptes"
                collapsed={collapsed}
              />
            )}
          </Section>

          <Section title="AGENCE" collapsed={collapsed}>
            <Item
              to="/Discussion"
              icon={House}
              label="Disscusion Entre Agence"
              collapsed={collapsed}
            />
          </Section>
        </nav>
      </aside>

      {/* ==== Contenu principal ==== */}
      <div className={`min-w-0 flex flex-col ${sbWidthClass}`}>
        {/* Topbar */}
        <header
          className={`sticky top-0 z-30 border-b ${
            isDark
              ? "border-slate-800 bg-slate-900/80"
              : "border-slate-200/60 bg-white/70"
          } backdrop-blur supports-[backdrop-filter]:bg-white/60`}
        >
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 h-[60px] sm:h-[70px] flex items-center justify-between gap-3">
            {/* Gauche : titre page */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 hover:bg-blue-50/30 focus-visible:ring-2 focus-visible:ring-blue-300 md:hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Menu
                  className={`icon-dyn ${
                    isDark ? "text-slate-100" : "text-blue-700"
                  }`}
                />
              </button>
              <div
                className={`hidden md:block text-dyn-title ${
                  isDark ? "text-slate-100" : "text-slate-800"
                } text-topbar truncate`}
              >
                {pageTitle}
              </div>
              <div
                className={`md:hidden text-sm font-semibold ${
                  isDark ? "text-slate-100" : "text-slate-800"
                } truncate`}
              >
                {pageTitle}
              </div>
            </div>

            {/* Droite : actions + profil responsive */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Thème */}
              <button
                className="btn-chips shine-on-hover hidden xs:inline-flex"
                onClick={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
                title={
                  isDark ? "Passer en thème clair" : "Passer en thème sombre"
                }
              >
                {isDark ? (
                  <Sun className="icon-dyn-sm" />
                ) : (
                  <Moon className="icon-dyn-sm" />
                )}
              </button>

              {/* Déconnexion (desktop uniquement) */}
              <LogoutButton
                className={`hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-semibold 
                            transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] ring-1
                            ${
                              isDark
                                ? "bg-rose-600/90 text-white ring-rose-500 hover:bg-rose-600"
                                : "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100"
                            }`}
              />

              {/* Profil rapide : avatar + badge NOM • RÔLE */}
              {(() => {
                const seed = encodeURIComponent(fullName);
                const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=gradientLinear`;

                return (
                  <div
                    className={`flex items-center gap-2 sm:gap-3 rounded-2xl border ${
                      isDark
                        ? "border-slate-700 bg-slate-800/95"
                        : "border-slate-200 bg-white/95"
                    } px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md max-w-[70vw]`}
                    title={authUser?.email || ""}
                  >
                    <img
                      src={avatar}
                      alt={fullName}
                      className="rounded-full ring-2 ring-blue-400/70 object-cover transition-transform duration-200 hover:scale-105"
                      style={{
                        width: `calc(var(--app-fs) + 6px)`,
                        height: `calc(var(--app-fs) + 6px)`,
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-[2px] text-[10px] sm:text-[11px] font-semibold ${roleBadgeClass}`}
                        title={`${fullName} • ${roleLabel}`}
                      >
                        <UserCircle2 className="h-3 w-3" />
                        <span className="truncate max-w-[9rem] sm:max-w-[12rem]">
                          {fullName} • {roleLabel}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Drawer Mobile (rendu seulement quand ouvert) */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/50 transition-opacity duration-300 opacity-100"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className={[
                "absolute left-0 top-0 h-full w-[82%] max-w-[320px]",
                APP_GRADIENT,
                SIDEBAR_CHROME,
                "shadow-2xl will-change-transform transform transition-transform duration-300 ease-out translate-x-0",
              ].join(" ")}
              style={{ ["--app-fs"]: `${baseFont}px` }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-white/90 flex items-center justify-center ring-1 ring-white/60 overflow-hidden shadow-sm shrink-0">
                    <img src={Logo} alt="Logo BMVT" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-white text-dyn-brand truncate">
                      BMVT HADJ &amp; OUMRA
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/70 truncate">
                      Bakayoko Mawa Voyages &amp; Tourismes
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  aria-label="Fermer le menu"
                >
                  <X className="text-white icon-dyn-sm" />
                </button>
              </div>

              <nav className="p-3 space-y-5 overflow-y-auto h-[calc(100%-56px)]">
                {canSee("dashboard") && (
                  <MobileGroup title="Tableau de bord">
                    <MobileItem
                      to="/tableau-de-bord"
                      icon={LayoutDashboard}
                      label="Tableau de bord"
                    />
                  </MobileGroup>
                )}

                <MobileGroup title="Pèlerins">
                  <MobileItem to="/pelerins" icon={Users} label="Ajouter / Liste" />
                  <MobileItem
                    to="/Impressions-Pelerins"
                    icon={Printer}
                    label="Impression fiche"
                  />
                  <MobileItem
                    to="/stats-pelerins"
                    icon={BarChart3}
                    label="Statistiques"
                  />
                  <MobileItem
                    to="/listes-pelerins"
                    icon={List}
                    label="Lists Pilgrims"
                  />
                </MobileGroup>

                <MobileGroup title="Médicale">
                  <MobileItem
                    to="/medicale"
                    icon={Stethoscope}
                    label="Suivi médical"
                  />
                </MobileGroup>

                <MobileGroup title="Offres">
                  <MobileItem
                    to="/Enregistrement_Offres"
                    icon={HandCoins}
                    label="Enregistrement Des Offres"
                  />
                </MobileGroup>

                <MobileGroup title="Paiement">
                  <MobileItem
                    to="/paiement"
                    icon={Wallet}
                    label="Règlements & échéances"
                  />
                  <MobileItem to="/factures" icon={FileText} label="Factures" />
                </MobileGroup>

                <MobileGroup title="Voyage">
                  <MobileItem
                    to="/voyage"
                    icon={Plane}
                    label="Vols & Chambres"
                  />
                  <MobileItem to="/voyages" icon={Plane} label="Voyages" />
                </MobileGroup>

                <MobileGroup title="Utilisateurs">
                  {canSee("comptes") && (
                    <MobileItem
                      to="/utilisateurs"
                      icon={UserCircle2}
                      label="Comptes"
                    />
                  )}
                </MobileGroup>

                <MobileGroup title="Agence">
                  <MobileItem
                    to="/Discussion"
                    icon={House}
                    label="Disscusion Entre Agence"
                  />
                </MobileGroup>

                {/* Déconnexion mobile */}
                <div className="pt-2">
                  <LogoutButton
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-semibold 
                                transition-all duration-200 hover:translate-x-1 ring-1
                                ${
                                  isDark
                                    ? "bg-rose-600/90 text-white ring-rose-500 hover:bg-rose-600"
                                    : "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100"
                                }`}
                  />
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* Zone pages */}
        <main className="min-w-0 h-[calc(100vh-60px)] sm:h-[calc(100vh-70px)] overflow-y-auto">
          <div
            className={`mx-auto max-w-[1400px] p-4 sm:p-5 md:p-7 lg:p-9 text-dyn ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
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
          "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)] active:translate-y-0",
          "focus-visible:outline-none relative",
          "text-dyn",
        ].join(" ")
      }
    >
      <ActiveAccent />
      <Icon className="text-white group-[.active]:text-blue-700 icon-dyn-sm transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[6deg]" />
      {!collapsed && <span className="truncate transition-colors">{label}</span>}
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
        `flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-all duration-200 text-dyn
         ${
           isActive
             ? "bg-white/15 text-white ring-2 ring-white/40"
             : "text-white/90 hover:bg-white/10 hover:translate-x-1"
         }`
      }
    >
      <Icon className="text-white icon-dyn-sm transition-transform duration-200 group-hover:scale-110" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
