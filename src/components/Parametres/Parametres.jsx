import React, { useState, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import { Save, Building2, FileText, Users, Trash2, Download, Image, Stamp, Palette, Globe, Sun, Moon } from 'lucide-react'

export default function Parametres() {
  const { state, dispatch } = useApp()
  const { langue, changeLangue, theme, changeTheme, couleur, changeCouleur } = usePreferences()
  const [onglet, setOnglet] = useState('entreprise')
  const logoInputRef = useRef(null)
  const cachetInputRef = useRef(null)

  const [entreprise, setEntreprise] = useState({ ...state.entreprise })
  const [params, setParams] = useState({ ...state.parametres })

  const handleSaveEntreprise = () => {
    dispatch({ type: 'SET_ENTREPRISE', payload: entreprise })
    alert('Informations de l\'entreprise enregistrées !')
  }

  const handleSaveParams = () => {
    dispatch({ type: 'SET_PARAMETRES', payload: params })
    alert('Paramètres enregistrés !')
  }

  const handleImageUpload = (field, e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 Mo')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setEntreprise({ ...entreprise, [field]: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (field) => {
    setEntreprise({ ...entreprise, [field]: null })
  }

  const handleExportData = () => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `koleya-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Sauvegarde en SQL (instructions INSERT par table) — export « base de données » lisible
  const handleExportSQL = () => {
    const echap = (v) => {
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'"
      return "'" + String(v).replace(/'/g, "''") + "'"
    }
    const table = (nom, lignes) =>
      lignes.length
        ? lignes
            .map((r) => `INSERT INTO ${nom} (${Object.keys(r).join(', ')}) VALUES (${Object.values(r).map(echap).join(', ')});`)
            .join('\n')
        : `-- ${nom} : aucune ligne`

    const sql = [
      '-- =============================================',
      '-- Koleya — sauvegarde des données (SQL)',
      `-- Générée le ${new Date().toLocaleString('fr-FR')}`,
      '-- =============================================',
      table('clients', state.clients),
      table('factures', state.factures),
      table('credits', state.credits),
      table('produits', state.produits),
      table('employes', state.employes),
      table('depenses', state.depenses),
    ].join('\n\n')

    const blob = new Blob([sql], { type: 'application/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `koleya-backup-${new Date().toISOString().slice(0, 10)}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) {
      if (confirm('Êtes-vous vraiment sûr ? Toutes les factures, clients, produits et employés seront supprimés.')) {
        dispatch({ type: 'RESET_DATA' })
        alert('Données réinitialisées.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit">
        {['entreprise', 'facturation', 'systeme', 'preferences'].map((tab) => (
          <button key={tab} onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              onglet === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}>
            {tab === 'entreprise' ? 'Entreprise'
              : tab === 'facturation' ? 'Facturation'
              : tab === 'systeme' ? 'Système'
              : 'Préférences'}
          </button>
        ))}
      </div>

      {onglet === 'entreprise' && (
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-dark-900">Informations de l’entreprise</h3>
              <p className="text-xs text-dark-500">Ces informations apparaissent sur vos factures et devis</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Nom de l’entreprise</label>
              <input type="text" value={entreprise.nom} onChange={(e) => setEntreprise({ ...entreprise, nom: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Adresse</label>
              <input type="text" value={entreprise.adresse} onChange={(e) => setEntreprise({ ...entreprise, adresse: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Téléphone</label>
                <input type="tel" value={entreprise.telephone} onChange={(e) => setEntreprise({ ...entreprise, telephone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" value={entreprise.email} onChange={(e) => setEntreprise({ ...entreprise, email: e.target.value })} className="input" />
              </div>
            </div>
            <div>
              <label className="input-label">N RCCM</label>
              <input type="text" value={entreprise.nrcc} onChange={(e) => setEntreprise({ ...entreprise, nrcc: e.target.value })} className="input" placeholder="Optionnel" />
            </div>

            {/* Logo */}
            <div>
              <label className="input-label">Logo de l’entreprise</label>
              <p className="text-xs text-dark-400 mb-2">Apparaît en haut à gauche des factures et devis (max 2 Mo)</p>
              <div className="flex items-center gap-4">
                {entreprise.logo ? (
                  <div className="relative">
                    <img src={entreprise.logo} alt="Logo" className="h-20 w-20 object-contain rounded-lg border border-dark-200 bg-white p-1" />
                    <button onClick={() => handleRemoveImage('logo')} className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-600">
                      x
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-dark-300 rounded-lg flex flex-col items-center justify-center text-dark-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                    <Image className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Logo</span>
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload('logo', e)} className="hidden" />
                {entreprise.logo && (
                  <button onClick={() => logoInputRef.current?.click()} className="btn-secondary text-sm">
                    <Image className="w-4 h-4" />
                    Changer
                  </button>
                )}
              </div>
            </div>

            {/* Cachet */}
            <div>
              <label className="input-label">Cachet de l’entreprise</label>
              <p className="text-xs text-dark-400 mb-2">Apparaît en bas à droite des factures et devis (max 2 Mo)</p>
              <div className="flex items-center gap-4">
                {entreprise.cachet ? (
                  <div className="relative">
                    <img src={entreprise.cachet} alt="Cachet" className="h-24 w-24 object-contain rounded-lg border border-dark-200 bg-white p-1" />
                    <button onClick={() => handleRemoveImage('cachet')} className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-600">
                      x
                    </button>
                  </div>
                ) : (
                  <button onClick={() => cachetInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-dark-300 rounded-lg flex flex-col items-center justify-center text-dark-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                    <Stamp className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Cachet</span>
                  </button>
                )}
                <input ref={cachetInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload('cachet', e)} className="hidden" />
                {entreprise.cachet && (
                  <button onClick={() => cachetInputRef.current?.click()} className="btn-secondary text-sm">
                    <Image className="w-4 h-4" />
                    Changer
                  </button>
                )}
              </div>
            </div>

            <button onClick={handleSaveEntreprise} className="btn-primary mt-2">
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {onglet === 'facturation' && (
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-dark-900">Paramètres de facturation</h3>
              <p className="text-xs text-dark-500">Configuration des factures et devis</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Préfixe facture</label>
                <input type="text" value={params.prefixeFacture} onChange={(e) => setParams({ ...params, prefixeFacture: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">Préfixe devis</label>
                <input type="text" value={params.prefixeDevis} onChange={(e) => setParams({ ...params, prefixeDevis: e.target.value })} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Devise</label>
                <input type="text" value={params.devise} onChange={(e) => setParams({ ...params, devise: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">TVA (%)</label>
                <input type="number" value={params.tva} onChange={(e) => setParams({ ...params, tva: parseInt(e.target.value) || 0 })} className="input" min="0" max="100" />
              </div>
            </div>
            <div>
              <label className="input-label">Délai de paiement (jours)</label>
              <input type="number" value={params.delaiPaiement} onChange={(e) => setParams({ ...params, delaiPaiement: parseInt(e.target.value) || 30 })} className="input" min="1" />
            </div>
            <button onClick={handleSaveParams} className="btn-primary mt-2">
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {onglet === 'systeme' && (
        <div className="space-y-6 max-w-2xl">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark-900">Sauvegarde et Données</h3>
                <p className="text-xs text-dark-500">Exportez ou réinitialisez vos données</p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleExportData} className="btn-primary w-full justify-center">
                <Download className="w-4 h-4" />
                Exporter toutes les données (JSON)
              </button>
              <button onClick={handleExportSQL} className="btn-secondary w-full justify-center">
                <Download className="w-4 h-4" />
                Exporter en SQL (base de données)
              </button>
              <button onClick={handleResetData} className="btn-danger w-full justify-center">
                <Trash2 className="w-4 h-4" />
                Réinitialiser toutes les données
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-dark-900 mb-4">Informations</h3>
            <div className="space-y-2 text-sm text-dark-600">
              <p><strong>Application :</strong> Koleya - ERP PME v1.0.0</p>
              <p><strong>Développé pour :</strong> PME au Cameroun</p>
              <p><strong>Devise :</strong> FCFA (Franc CFA)</p>
              <p><strong>Stockage :</strong> Base de données PostgreSQL (serveur)</p>
              <p className="text-xs text-dark-400 mt-3">
                Les données sont stockées sur le serveur. Effectuez des sauvegardes régulières (JSON, SQL ou dump PostgreSQL via deploy/backup.sh).
              </p>
            </div>
          </div>
        </div>
      )}

      {onglet === 'preferences' && (
        <div className="space-y-6 max-w-2xl">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark-900">Langue</h3>
                <p className="text-xs text-dark-500">Français, Anglais, Arabe — le menu se traduit immédiatement.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[{ code: 'fr', label: 'Français' }, { code: 'en', label: 'English' }, { code: 'ar', label: 'العربية' }].map((l) => (
                <button key={l.code} onClick={() => changeLangue(l.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${langue === l.code ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark-900">Thème</h3>
                <p className="text-xs text-dark-500">Clair ou sombre.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeTheme('clair')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'clair' ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                ☀️ Clair
              </button>
              <button onClick={() => changeTheme('sombre')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'sombre' ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                🌙 Sombre
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-dark-900">Couleur de l’entreprise</h3>
                <p className="text-xs text-dark-500">Appliquée aux boutons, liens et accents.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['#4c6ef5', '#e8590c', '#2f9e44', '#e03131', '#9c36b5', '#0ca678', '#f08c00', '#1c7ed6'].map((c) => (
                <button key={c} onClick={() => changeCouleur(c)}
                  className="w-9 h-9 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                  style={{ background: c, outline: couleur === c ? '2px solid #333' : 'none' }} />
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-dark-600 cursor-pointer">
                <input type="color" value={couleur} onChange={(e) => changeCouleur(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                Personnalisé
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
