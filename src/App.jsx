import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AbonnementProvider } from './contexts/AbonnementContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { ToastProvider } from './components/UI/Toast'
import ErrorBoundary from './components/UI/ErrorBoundary'
import Layout from './components/Layout/Layout'
import { Loader2 } from 'lucide-react'

// =============================================
// LAZY LOADING — Chaque module est charge a la demande
// =============================================

// Pages publiques (legeres)
const Landing = lazy(() => import('./components/Landing/Landing'))
const Auth = lazy(() => import('./components/Auth/Auth'))

// Pages admin (lourdes, chargees apres login)
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'))
const Facturation = lazy(() => import('./components/Facturation/Facturation'))
const NouvelleFacture = lazy(() => import('./components/Facturation/NouvelleFacture'))
const CreditClient = lazy(() => import('./components/Credit/CreditClient'))
const Stock = lazy(() => import('./components/Stock/Stock'))
const StockAvance = lazy(() => import('./components/Stock/StockAvance'))
const Comptabilite = lazy(() => import('./components/Comptabilite/Comptabilite'))
const RH = lazy(() => import('./components/RH/RH'))
const Devis = lazy(() => import('./components/Devis/Devis'))
const ClientPortal = lazy(() => import('./components/ClientPortal/ClientPortal'))
const Rapports = lazy(() => import('./components/Rapports/Rapports'))
const Notifications = lazy(() => import('./components/Notifications/Notifications'))
const Parametres = lazy(() => import('./components/Parametres/Parametres'))
const Clients = lazy(() => import('./components/Clients/Clients'))
const Documents = lazy(() => import('./components/Documents/Documents'))
const PlanPage = lazy(() => import('./components/Payment/PlanPage'))
const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'))

// Pages publiques du site
const PublicLayout = lazy(() => import('./components/Landing/PublicLayout'))
const RedirectToSection = lazy(() => import('./pages/RedirectToSection'))
const ApiPage = lazy(() => import('./pages/ApiPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))

// =============================================
// LOADER GLOBAL
// =============================================
function Loader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
        <p className="text-sm text-dark-500">Chargement...</p>
      </div>
    </div>
  )
}

// =============================================
// ROUTES
// =============================================
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Pages publiques du site */}
        <Route path="/fonctionnalites" element={<RedirectToSection to="fonctionnalites" />} />
        <Route path="/tarifs" element={<RedirectToSection to="tarifs" />} />
        <Route path="/faq" element={<RedirectToSection to="faq" />} />
        <Route path="/api" element={<PublicLayout><ApiPage /></PublicLayout>} />
        <Route path="/changelog" element={<PublicLayout><ChangelogPage /></PublicLayout>} />
        <Route path="/aide" element={<PublicLayout><HelpPage /></PublicLayout>} />
        <Route path="/documentation" element={<PublicLayout><DocumentationPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/status" element={<PublicLayout><StatusPage /></PublicLayout>} />
        <Route path="/confidentialite" element={<PublicLayout><LegalPage type="confidentialite" /></PublicLayout>} />
        <Route path="/conditions" element={<PublicLayout><LegalPage type="conditions" /></PublicLayout>} />
        <Route path="/cookies" element={<PublicLayout><LegalPage type="cookies" /></PublicLayout>} />

        {/* Authentification */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* Application */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="facturation" element={<Facturation />} />
          <Route path="facturation/nouvelle" element={<NouvelleFacture />} />
          <Route path="facturation/nouvelle/:type" element={<NouvelleFacture />} />
          <Route path="devis" element={<Devis />} />
          <Route path="credit" element={<CreditClient />} />
          <Route path="clients" element={<Clients />} />
          <Route path="documents" element={<Documents />} />
          <Route path="stock" element={<Stock />} />
          <Route path="stock/avance" element={<StockAvance />} />
          <Route path="comptabilite" element={<Comptabilite />} />
          <Route path="rh" element={<RH />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="portail-client" element={<ClientPortal />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

// =============================================
// APP PRINCIPAL
// =============================================
export default function App() {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <AuthProvider>
          <ToastProvider>
            <AppProvider>
              <AbonnementProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </AbonnementProvider>
            </AppProvider>
          </ToastProvider>
        </AuthProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  )
}
