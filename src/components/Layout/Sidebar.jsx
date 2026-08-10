import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import {
  LayoutDashboard, FileText, CreditCard, Package,
  Calculator, Users, Settings, X, Receipt, Building2,
  FileOutput, LogOut, Bell, BarChart3, UserCheck, ShieldCheck, FolderOpen
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/app', icon: LayoutDashboard },
  { name: 'Facturation', href: '/app/facturation', icon: FileText },
  { name: 'Devis', href: '/app/devis', icon: FileOutput },
  { name: 'Crédit Client', href: '/app/credit', icon: CreditCard },
  { name: 'Clients', href: '/app/clients', icon: Users },
  { name: 'Stock', href: '/app/stock', icon: Package },
  { name: 'Notifications', href: '/app/notifications', icon: Bell },
  { name: 'Rapports', href: '/app/rapports', icon: BarChart3 },
  { name: 'Portail Client', href: '/app/portail-client', icon: UserCheck },
  { name: 'Documents', href: '/app/documents', icon: FolderOpen },
  { name: 'Comptabilité', href: '/app/comptabilite', icon: Calculator },
  { name: 'RH & Paie', href: '/app/rh', icon: Users },
  { name: 'Paramètres', href: '/app/parametres', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = usePreferences()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-72 bg-white border-r border-dark-200/50
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-5 border-b border-dark-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-900 font-display tracking-tight">Koleya</h1>
              <p className="text-[10px] text-dark-500 uppercase tracking-widest">ERP PME</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-dark-100 text-dark-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navigation principale">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/app' && location.pathname.startsWith(item.href))
            return (
              <NavLink
                key={t(item.name)}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-dark-400'}`} />
                {t(item.name)}
              </NavLink>
            )
          })}

          {/* Administration plateforme — visible uniquement pour le super admin */}
          {user?.est_super_admin && (
            <NavLink
              to="/app/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                location.pathname.startsWith('/app/admin')
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${location.pathname.startsWith('/app/admin') ? 'text-primary-600' : 'text-dark-400'}`} />
              Administration
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-dark-100 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-700">
                {user?.nom?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-800 truncate">{user?.nom || 'Utilisateur'}</p>
              <p className="text-xs text-dark-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Deconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
