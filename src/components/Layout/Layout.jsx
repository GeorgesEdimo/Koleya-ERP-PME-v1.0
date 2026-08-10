import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Timer, AlertTriangle } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAbonnement } from '../../contexts/AbonnementContext'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { abonnement, isExpired, isTrial, joursRestants } = useAbonnement()

  return (
    <div className="flex h-screen overflow-hidden bg-dark-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Bannière d'abonnement (essai en cours / essai expiré) */}
        {abonnement && (isExpired || isTrial) && (
          <div
            className={`px-4 py-2 text-sm font-medium flex items-center justify-between gap-3 border-b ${
              isExpired
                ? 'bg-danger-50 text-danger-700 border-danger-200'
                : 'bg-primary-50 text-primary-700 border-primary-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {isExpired ? (
                <>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Abonnement expiré — accès en <strong>lecture seule</strong>, export désactivé.</span>
                </>
              ) : (
                <>
                  <Timer className="w-4 h-4 flex-shrink-0" />
                  <span>Essai gratuit — <strong>{joursRestants ?? '…'} jour(s)</strong> restants. Limites : 10 factures, 5 clients, 3 produits.</span>
                </>
              )}
            </div>
            <Link
              to="/app/plan"
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                isExpired ? 'bg-danger-600 text-white hover:bg-danger-700' : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              Choisir un plan
            </Link>
          </div>
        )}

        <main
          className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6"
          role="main"
          aria-label="Contenu principal"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
