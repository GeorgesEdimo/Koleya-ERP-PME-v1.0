import React, { useEffect, useState } from 'react'
import { Building2, RotateCcw, Search, ShieldCheck, Users, FileText, Package, CreditCard } from 'lucide-react'
import { adminAPI } from '../../utils/api'

const ressources = [
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'credits', label: 'Crédits', icon: CreditCard },
  { key: 'produits', label: 'Produits', icon: Package },
]

export default function AdminPanel() {
  const [entreprises, setEntreprises] = useState([])
  const [selected, setSelected] = useState(null)
  const [ressource, setRessource] = useState('factures')
  const [items, setItems] = useState([])
  const [voirSupprimes, setVoirSupprimes] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    adminAPI.entreprises().then((d) => setEntreprises(d.entreprises)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    adminAPI.ressource(selected, ressource, voirSupprimes ? 'true' : undefined)
      .then((d) => setItems(d[ressource] || []))
      .finally(() => setLoading(false))
  }, [selected, ressource, voirSupprimes])

  const restaurer = async (table, id) => {
    setLoading(true)
    try {
      await adminAPI.restaurer(table, id)
      setMsg('Élément restauré ✓')
      const d = await adminAPI.ressource(selected, table, voirSupprimes ? 'true' : undefined)
      setItems(d[table] || [])
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary-600" />
        <h1 className="page-title">Administration plateforme</h1>
      </div>
      <p className="text-sm text-dark-500">Super administrateur : voir toutes les entreprises et restaurer les éléments supprimés.</p>

      {msg && <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-2 text-sm text-success-700">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des entreprises */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-dark-400" />
            <h2 className="font-semibold text-dark-900">Entreprises ({entreprises.length})</h2>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {entreprises.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelected(e.id); setRessource('factures'); setVoirSupprimes(false) }}
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  selected === e.id ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:bg-dark-50'
                }`}
              >
                <p className="font-medium text-dark-900 truncate">{e.nom}</p>
                <p className="text-xs text-dark-500">
                  Plan {e.plan} · {e.essai_active ? `Essai (fin ${new Date(e.essai_fin).toLocaleDateString('fr-FR')})` : 'Payant'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Données de l'entreprise sélectionnée */}
        <div className="card p-5 lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-dark-400 flex items-center gap-2"><Search className="w-4 h-4" /> Sélectionnez une entreprise.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {ressources.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRessource(r.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      ressource === r.key ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    <r.icon className="w-3.5 h-3.5" /> {r.label}
                  </button>
                ))}
                <label className="ml-auto flex items-center gap-2 text-sm text-dark-600">
                  <input
                    type="checkbox"
                    checked={voirSupprimes}
                    onChange={(e) => setVoirSupprimes(e.target.checked)}
                    className="accent-primary-600"
                  />
                  Éléments supprimés
                </label>
              </div>

              {loading ? (
                <p className="text-sm text-dark-400">Chargement…</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-dark-400">Aucun élément.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between rounded-xl border border-dark-200 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-dark-900 truncate">{it.nom || it.numero || it.client_nom || it.description || it.id}</p>
                        <p className="text-xs text-dark-500">
                          {it.telephone || it.statut || it.total ? `Tél: ${it.telephone} · Statut: ${it.statut} · Total: ${it.total}` : it.id}
                        </p>
                      </div>
                      {voirSupprimes && (
                        <button
                          onClick={() => restaurer(ressource, it.id)}
                          className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-success-600 hover:text-success-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
