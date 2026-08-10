import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, Bell, LogOut, Printer, RefreshCw, Loader2, Sun, Moon } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { usePreferences } from '../../contexts/PreferencesContext'

const pageTitles = {
  '/app': 'Tableau de bord',
  '/app/facturation': 'Facturation',
  '/app/devis': 'Devis',
  '/app/credit': 'Crédit Client',
  '/app/clients': 'Clients',
  '/app/stock': 'Gestion de Stock',
  '/app/documents': 'Documents',
  '/app/notifications': 'Notifications',
  '/app/rapports': 'Rapports',
  '/app/portail-client': 'Portail Client',
  '/app/comptabilite': 'Comptabilité',
  '/app/rh': 'RH & Paie',
  '/app/parametres': 'Paramètres',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, changeTheme } = usePreferences()
  const { refresh, loading } = useApp()

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path) return title
    }
    if (location.pathname.startsWith('/app/facturation')) return 'Facturation'
    if (location.pathname.startsWith('/app/devis')) return 'Devis'
    return 'Koleya'
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-dark-100 flex items-center justify-between px-3 sm:px-4 lg:px-6 no-print" role="banner">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-dark-100 text-dark-600"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-semibold text-dark-900 font-display">{getTitle()}</h2>
          <p className="text-[10px] sm:text-xs text-dark-500 hidden sm:block">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <button
          onClick={() => changeTheme(theme === 'sombre' ? 'clair' : 'sombre')}
          className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
          title={theme === 'sombre' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'sombre' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => window.print()}
          className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
          title="Imprimer cette page (PDF via l'imprimante)"
        >
          <Printer className="w-5 h-5" />
        </button>

        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
          title="Actualiser les données"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-dark-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">{user?.nom?.charAt(0) || 'U'}</span>
          </div>
          <span className="text-sm font-medium text-dark-700 max-w-[100px] truncate">{user?.nom || 'User'}</span>
        </div>

        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors" title="Deconnexion">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
