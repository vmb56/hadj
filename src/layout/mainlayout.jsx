// src/layouts/MainLayout.jsx
import React, { useEffect, useState } from "react";
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
} from "lucide-react";

const APP_GRADIENT =
  "bg-[linear-gradient(180deg,#ffbc54_0%,#ff8f33_46%,#c55a1b_100%)]";
const CONTENT_BG =
  "bg-[linear-gradient(180deg,rgba(8,13,20,0.75)_0%,rgba(10,15,23,0.95)_100%)]";
const linkBase =
  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none transition-all";
const linkIdle =
  "text-white/85 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40";
const linkActive =
  "text-white bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,.16)]";

function ActiveAccent() {
  return (
    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-white/90 shadow shadow-black/30 transition-all duration-300 group-[.active]:opacity-100 opacity-0" />
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // false = 288px, true = 80px
  const { pathname } = useLocation();

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [mobileOpen]);

  // largeur sidebar desktop selon l’état
  const sbWidthClass = collapsed ? "md:ml-[80px]" : "md:ml-72";

  return (
    <div className={`w-full ${CONTENT_BG}`} style={{ minHeight: "100vh" }}>
      {/* ====== SIDEBAR Desktop — FIXE ====== */}
      <aside
        className={[
          "hidden md:flex fixed left-0 top-0 h-screen flex-col border-r border-black/40 transition-[width] duration-300",
          collapsed ? "w-[80px]" : "w-72",
          APP_GRADIENT,
          "z-40", // au-dessus du contenu
        ].join(" ")}
      >
        <div className="relative px-4 py-3 border-b border-black/35 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-white" />
            {!collapsed && (
              <div className="font-extrabold tracking-tight text-white drop-shadow">
                BMVT HADJ & OUMRA
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md border border-white/20 p-1 hover:bg-white/10"
            title={collapsed ? "Étendre la barre" : "Réduire la barre"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
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
            <Item to="/voyage" icon={Plane} label="Vols & bus" collapsed={collapsed} />
          </Section>

          <Section title="Utilisateurs" collapsed={collapsed}>
            <Item to="/utilisateurs" icon={UserCircle2} label="Comptes" collapsed={collapsed} />
            <Item to="/settings" icon={Settings} label="Paramètres" collapsed={collapsed} />
          </Section>

          <Section title="Impressions" collapsed={collapsed}>
            <Item to="/impressions-passeports" icon={Printer} label="Photos / Passeport" collapsed={collapsed} />
          </Section>
        </nav>
      </aside>

      {/* ====== CONTENU (décalé par la sidebar fixe) ====== */}
      <div className={`min-w-0 ${sbWidthClass} md:pr-0 flex flex-col`}>

        {/* Topbar mobile (le layout desktop est déjà fixe) */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur flex items-center justify-between px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
          <div className="font-bold text-white">BMVT HADJ & OUMRA</div>
          <div className="w-6" />
        </header>

        {/* Drawer Mobile (animé) */}
        <div
          className={[
            "fixed inset-0 z-50 md:hidden pointer-events-none",
            mobileOpen ? "pointer-events-auto" : "",
          ].join(" ")}
          aria-hidden={!mobileOpen}
        >
          <div
            className={[
              "absolute inset-0 bg-black/60 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={[
              "absolute left-0 top-0 h-full w-[82%] max-w-[320px] border-r border-black/40",
              APP_GRADIENT,
              "shadow-2xl will-change-transform transform transition-transform duration-300 ease-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/35">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-white" />
                <div className="font-extrabold text-white">BMVT HADJ & OUMRA</div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <nav className="p-3 space-y-4 overflow-y-auto h-[calc(100%-56px)]">
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
                <MobileItem to="/voyage" icon={Plane} label="Vols & bus" />
              </MobileGroup>
              <MobileGroup title="Utilisateurs">
                <MobileItem to="/utilisateurs" icon={UserCircle2} label="Comptes" />
                <MobileItem to="/settings" icon={Settings} label="Paramètres" />
              </MobileGroup>
              <MobileGroup title="Impressions">
                <MobileItem to="/impressions" icon={Printer} label="Photos / Passeport" />
              </MobileGroup>
            </nav>
          </aside>
        </div>

        {/* Zone pages — hauteur écran + scroll interne UNIQUEMENT ici */}
        <main className="min-w-0 h-screen overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8 text-slate-50">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------ sous-composants ------------ */
function Section({ title, children, collapsed }) {
  if (collapsed) return <div className="space-y-1.5">{children}</div>;
  return (
    <div>
      <div className="mb-2 select-none rounded-md border border-black/25 bg-black/15 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-black/80 shadow-inner">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
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
          "ring-0 focus-visible:outline-none relative",
        ].join(" ")
      }
    >
      <ActiveAccent />
      <Icon className="h-[18px] w-[18px] shrink-0 drop-shadow" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-slate-800 px-2 py-1 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100"
          role="tooltip"
        >
          {label}
        </span>
      )}
    </NavLink>
  );
}

function MobileGroup({ title, children }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-black/80">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function MobileItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition
         ${isActive ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"}`
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
