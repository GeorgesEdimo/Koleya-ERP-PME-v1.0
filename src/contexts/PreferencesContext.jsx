import React, { createContext, useContext, useState, useEffect } from 'react'

const PreferencesContext = createContext()

// Dictionnaire minimal (périmètre : navigation + points d'entrée)
// À étendre module par module au fil du temps.
const I18N = {
  fr: {
    'Tableau de bord': 'Tableau de bord', Facturation: 'Facturation', Devis: 'Devis',
    'Crédit Client': 'Crédit Client', Clients: 'Clients', Stock: 'Stock',
    Notifications: 'Notifications', Rapports: 'Rapports', 'Portail Client': 'Portail Client',
    Comptabilité: 'Comptabilité', 'RH & Paie': 'RH & Paie', Paramètres: 'Paramètres',
    Documents: 'Documents',
  },
  en: {
    'Tableau de bord': 'Dashboard', Facturation: 'Invoicing', Devis: 'Quotes',
    'Crédit Client': 'Customer Credit', Clients: 'Customers', Stock: 'Stock',
    Notifications: 'Notifications', Rapports: 'Reports', 'Portail Client': 'Client Portal',
    Comptabilité: 'Accounting', 'RH & Paie': 'HR & Payroll', Paramètres: 'Settings',
    Documents: 'Documents',
  },
  ar: {
    'Tableau de bord': 'لوحة القيادة', Facturation: 'الفواتير', Devis: 'عروض الأسعار',
    'Crédit Client': 'ائتمان العملاء', Clients: 'العملاء', Stock: 'المخزون',
    Notifications: 'الإشعارات', Rapports: 'التقارير', 'Portail Client': 'بوابة العميل',
    Comptabilité: 'المحاسبة', 'RH & Paie': 'الموارد البشرية والرواتب', Paramètres: 'الإعدادات',
    Documents: 'المستندات',
  },
}

export function PreferencesProvider({ children }) {
  const [langue, setLangue] = useState(() => localStorage.getItem('koleya_langue') || 'fr')
  const [theme, setTheme] = useState(() => localStorage.getItem('koleya_theme') || 'clair')
  const [couleur, setCouleur] = useState(() => localStorage.getItem('koleya_couleur') || '#4c6ef5')

  // Application globale : classe .dark, couleur d'entreprise (variable CSS), direction RTL
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'sombre')
    root.style.setProperty('--couleur-entreprise', couleur)
    root.dir = langue === 'ar' ? 'rtl' : 'ltr'
  }, [theme, couleur, langue])

  const changeLangue = (l) => { setLangue(l); localStorage.setItem('koleya_langue', l) }
  const changeTheme = (t) => { setTheme(t); localStorage.setItem('koleya_theme', t) }
  const changeCouleur = (c) => { setCouleur(c); localStorage.setItem('koleya_couleur', c) }

  const t = (texte) => (I18N[langue] && I18N[langue][texte]) || texte

  return (
    <PreferencesContext.Provider value={{
      langue, changeLangue, theme, changeTheme, couleur, changeCouleur, t, RTL: langue === 'ar',
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => useContext(PreferencesContext)
