// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/mainlayout.jsx";

// Pèlerins (page + sous-pages)
import Pelerins from "./pages/pelerins/Pelerins.jsx";
import AjouterPelerin from "./pages/pelerins/sections/AjouterPelerin.jsx";
import ListePelerins from "./pages/pelerins/sections/ListePelerins.jsx";
import ModifierPelerin from "./pages/pelerins/modifier/ModifierPelerin.jsx";
import ImpressionsPelerins from "./pages/pelerins/Impressions-pelerins.jsx";

// Médicale
import Medicale from "./pages/medicales/Medicale.jsx";
import AjoutMedicale from "./pages/medicales/sections/AjoutMedicale.jsx";
import ImpressionMedicale from "./pages/medicales/sections/ImpressionMedicale.jsx";
import ListeMedicale from "./pages/medicales/sections/ListeMedicale.jsx";
import ModifierMedicale from "./pages/medicales/modifier/ModifierMedicale.jsx";
// Paiement
import Paiement from "./pages/paiements/Paiement.jsx";
import RecherchePaiement from "./pages/paiements/sections/RecherchePaiement.jsx";
import HistoriquesPaiement from "./pages/paiements/sections/HistoriquesPaiement.jsx";
import HistoriquesVersements from "./pages/paiements/sections/HistoriquesVersements.jsx";

// Autres sections

import Factures from "./pages/Factures";
import Voyage from "./pages/Voyage";
import Utilisateurs from "./pages/Utilisateurs";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import StatsPelerins from "./pages/StatsPelerins";

// Impressions (passeports)
import ImpressionsPasseports from "./pages/Impressions-passeport.jsx"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Redirection racine → pelerins */}
        <Route index element={<Navigate to="pelerins" replace />} />

        {/* Pèlerins avec sous-routes */}
        <Route path="pelerins" element={<Pelerins />}>
          <Route index element={<Navigate to="liste" replace />} />
          <Route path="ajouter" element={<AjouterPelerin />} />
          <Route path="liste" element={<ListePelerins />} />
          <Route path=":id/edit" element={<ModifierPelerin />} />

         
        </Route>
         {/* Impression fiche(s) pèlerins */}
          <Route path="Impressions-Pelerins" element={<ImpressionsPelerins />} />

        {/* Médicale avec sous-routes */}
        <Route path="medicale" element={<Medicale />}>
          <Route index element={<Navigate to="ajout" replace />} />
          <Route path="ajout" element={<AjoutMedicale />} />
          <Route path="liste" element={<ListeMedicale />} />
          <Route path="impression" element={<ImpressionMedicale />} />
          <Route path=":id/edit" element={<ModifierMedicale/>} />
        </Route>

        {/* paiemenmts */}
        <Route path="paiement" element={<Paiement />}>
  <Route index element={<Navigate to="recherche" replace />} />
  <Route path="recherche" element={<RecherchePaiement />} />
  <Route path="historiques" element={<HistoriquesPaiement />} />
  <Route path="versements" element={<HistoriquesVersements />} />
    </Route>

        {/* Impression des passeports (photos) */}
        <Route path="impressions-passeports" element={<ImpressionsPasseports />} />

        {/* Autres sections */}
        <Route path="paiement" element={<Paiement />} />
        <Route path="factures" element={<Factures />} />
        <Route path="voyage" element={<Voyage />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />

        <Route path="stats-pelerins" element={<StatsPelerins />} />

        {/* 404 */}
        <Route
          path="*"
          element={<div style={{ padding: 16 }}>Page introuvable</div>}
        />
      </Route>
    </Routes>
  );
}
