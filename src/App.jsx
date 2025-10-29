// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/mainlayout.jsx";

// === Auth (public)
import LoginPage from "./auth/Login.jsx";
import RegisterPage from "./auth/Register.jsx";
import ProtectedRoute from "./pages/routes/ProtectedRoute.jsx";

// Pèlerins (page + sous-pages)
import Pelerins from "./pages/pelerins/Pelerins.jsx";
import AjouterPelerin from "./pages/pelerins/sections/AjouterPelerin.jsx";
import ListePelerins from "./pages/pelerins/sections/ListePelerins.jsx";
import ModifierPelerin from "./pages/pelerins/modifier/ModifierPelerin.jsx";
import ImpressionsPelerins from "./pages/pelerins/Impressions-pelerins.jsx";

// Voyages
import Voyages from "./pages/Voyages/Voyages.jsx";
import Voyage from "./pages/Voyages/Voyage.jsx";
import Vols from "./pages/Voyages/sections/Vols.jsx";
import Chambres from "./pages/Voyages/sections/Chambres.jsx";

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

// Tableau de bord
import Dashboard from "./pages/Dashboard.jsx";

// Autres sections
import Factures from "./pages/Factures";
import Utilisateurs from "./pages/utilisateurs/Utilisateurs.jsx";
import ListeUtilisateurs from "./pages/utilisateurs/sections/ListeUtilisateurs.jsx";
import HistoriqueConnexion from "./pages/utilisateurs/sections/HistoriqueConnexion.jsx";
import InscriptionUtilisateur from "./pages/utilisateurs/sections/InscriptionUtilisateur.jsx";

// ⚠️ Import correct (export par défaut)
import ListsPilgrims from "./pages/ListsPilgrims.jsx";

import Profile from "./pages/Profile";
import StatsPelerins from "./pages/StatsPelerins";
import ImpressionsPasseports from "./pages/Impressions-passeport.jsx";
import EnregistrementOffres from "./pages/offres/EnregistrementOffres.jsx";

export default function App() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ===== Protégé : tout le reste nécessite un token ===== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          {/* Redirection racine → tableau de bord */}
          <Route index element={<Navigate to="tableau-de-bord" replace />} />

          {/* Tableau de bord */}
          <Route path="tableau-de-bord" element={<Dashboard />} />

          {/* Pèlerins avec sous-routes */}
          <Route path="pelerins" element={<Pelerins />}>
            <Route index element={<Navigate to="liste" replace />} />
            <Route path="ajouter" element={<AjouterPelerin />} />
            <Route path="liste" element={<ListePelerins />} />
            <Route path=":id/edit" element={<ModifierPelerin />} />
          </Route>

          {/* Impression fiche(s) pèlerins */}
          <Route path="Impressions-Pelerins" element={<ImpressionsPelerins />} />

          {/* Enregistrement des offres */}
          <Route path="Enregistrement_Offres" element={<EnregistrementOffres />} />

          {/* Médicale avec sous-routes */}
          <Route path="medicale" element={<Medicale />}>
            <Route index element={<Navigate to="ajout" replace />} />
            <Route path="ajout" element={<AjoutMedicale />} />
            <Route path="liste" element={<ListeMedicale />} />
            <Route path="impression" element={<ImpressionMedicale />} />
            <Route path=":id/edit" element={<ModifierMedicale />} />
          </Route>

          {/* Voyages (page à part) */}
          <Route path="voyages" element={<Voyages />} />

          {/* Voyage avec sous-routes */}
          <Route path="voyage" element={<Voyage />}>
            <Route index element={<Navigate to="vols" replace />} />
            <Route path="vols" element={<Vols />} />
            <Route path="chambres" element={<Chambres />} />
          </Route>

          {/* Paiement */}
          <Route path="paiement" element={<Paiement />}>
            <Route index element={<Navigate to="recherche" replace />} />
            <Route path="recherche" element={<RecherchePaiement />} />
            <Route path="historiques" element={<HistoriquesPaiement />} />
            <Route path="versements" element={<HistoriquesVersements />} />
          </Route>

          {/* Impression des passeports (photos) */}
          <Route path="impressions-passeports" element={<ImpressionsPasseports />} />

          {/* Utilisateurs avec sous-routes */}
          <Route path="utilisateurs" element={<Utilisateurs />}>
            <Route index element={<Navigate to="liste" replace />} />
            <Route path="liste" element={<ListeUtilisateurs />} />
            <Route path="historique" element={<HistoriqueConnexion />} />
            <Route path="inscription" element={<InscriptionUtilisateur />} />
          </Route>

          {/* Autres sections */}
          <Route path="factures" element={<Factures />} />

          {/* ✅ Utilisation correcte du composant */}
          <Route path="listes-pelerins" element={<ListsPilgrims />} />

          <Route path="profile" element={<Profile />} />
          <Route path="stats-pelerins" element={<StatsPelerins />} />

          {/* 404 protégée */}
          <Route path="*" element={<div style={{ padding: 16 }}>Page introuvable</div>} />
        </Route>
      </Route>

      {/* 404 publique (si on tombe hors layout ET hors auth) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
