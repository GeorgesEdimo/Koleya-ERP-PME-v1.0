import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Warehouse, ArrowRightLeft, History, Plus, Search,
  TrendingUp, TrendingDown, Package, Edit3, Trash2
} from 'lucide-react'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function StockAvance() {
  const { state, dispatch } = useApp()
  const [onglet, setOnglet] = useState('mouvements')
  const [showMouvement, setShowMouvement] = useState(false)
  const [showTransfert, setShowTransfert] = useState(false)
  const [filter, setFilter] = useState('tous')

  const [mouvementForm, setMouvementForm] = useState({
    produit_id: '', type_mouvement: 'entree', quantite: '', motif: '', reference: ''
  })

  const [transfertForm, setTransfertForm] = useState({
    produit_id: '', depot_source: '', depot_destination: '', quantite: '', motif: ''
  })

  // Simuler les mouvements de stock
  const mouvements = JSON.parse(localStorage.getItem('koleya_mouvements') || '[]')

  const filteredMouvements = mouvements.filter(m => {
    if (filter === 'tous') return true
    return m.type_mouvement === filter
  })

  const handleMouvement = (e) => {
    e.preventDefault()
    if (!mouvementForm.produit_id || !mouvementForm.quantite) return

    const produit = state.produits.find(p => p.id === parseInt(mouvementForm.produit_id))
    if (!produit) return

    const quantite = parseInt(mouvementForm.quantite)
    const stockAvant = produit.stock
    let stockApres = stockAvant

    if (mouvementForm.type_mouvement === 'entree') stockApres = stockAvant + quantite
    else if (mouvementForm.type_mouvement === 'sortie') stockApres = Math.max(0, stockAvant - quantite)
    else if (mouvementForm.type_mouvement === 'ajustement') stockApres = Math.max(0, stockAvant + quantite)

    // Mettre a jour le stock
    dispatch({ type: 'UPDATE_PRODUIT', payload: { id: parseInt(mouvementForm.produit_id), stock: stockApres } })

    // Enregistrer le mouvement
    const mouvement = {
      id: Date.now().toString(),
      produit_id: parseInt(mouvementForm.produit_id),
      produit_nom: produit.nom,
      type_mouvement: mouvementForm.type_mouvement,
      quantite,
      stock_avant: stockAvant,
      stock_apres: stockApres,
      motif: mouvementForm.motif,
      reference: mouvementForm.reference,
      date: new Date().toISOString(),
    }
    const stored = JSON.parse(localStorage.getItem('koleya_mouvements') || '[]')
    stored.unshift(mouvement)
    localStorage.setItem('koleya_mouvements', JSON.stringify(stored))

    setShowMouvement(false)
    setMouvementForm({ produit_id: '', type_mouvement: 'entree', quantite: '', motif: '', reference: '' })
  }

  const handleTransfert = (e) => {
    e.preventDefault()
    if (!transfertForm.produit_id || !transfertForm.quantite) return

    const produit = state.produits.find(p => p.id === parseInt(transfertForm.produit_id))
    if (!produit) return

    const quantite = parseInt(transfertForm.quantite)
    const stockAvant = produit.stock
    const stockApres = Math.max(0, stockAvant - quantite)

    dispatch({ type: 'UPDATE_PRODUIT', payload: { id: parseInt(transfertForm.produit_id), stock: stockApres } })

    const mouvement = {
      id: Date.now().toString(),
      produit_id: parseInt(transfertForm.produit_id),
      produit_nom: produit.nom,
      type_mouvement: 'transfert',
      quantite,
      stock_avant: stockAvant,
      stock_apres: stockApres,
      motif: `Transfert: ${transfertForm.motif || 'Inter-depots'}`,
      date: new Date().toISOString(),
    }
    const stored = JSON.parse(localStorage.getItem('koleya_mouvements') || '[]')
    stored.unshift(mouvement)
    localStorage.setItem('koleya_mouvements', JSON.stringify(stored))

    setShowTransfert(false)
    setTransfertForm({ produit_id: '', depot_source: '', depot_destination: '', quantite: '', motif: '' })
  }

  const typeLabels = {
    entree: { label: 'Entree', color: 'badge-success', icon: TrendingUp },
    sortie: { label: 'Sortie', color: 'badge-danger', icon: TrendingDown },
    transfert: { label: 'Transfert', color: 'badge-info', icon: ArrowRightLeft },
    ajustement: { label: 'Ajustement', color: 'badge-warning', icon: Edit3 },
    inventaire: { label: 'Inventaire', color: 'bg-dark-100 text-dark-600', icon: Package },
  }

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit">
        {[
          { id: 'mouvements', label: 'Mouvements', icon: History },
          { id: 'transferts', label: 'Transferts', icon: ArrowRightLeft },
        ].map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              onglet === tab.id ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setShowMouvement(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Nouveau mouvement
        </button>
        <button onClick={() => setShowTransfert(true)} className="btn-secondary text-sm">
          <ArrowRightLeft className="w-4 h-4" />
          Transfert
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {['tous', 'entree', 'sortie', 'transfert', 'ajustement'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-dark-200 hover:bg-dark-50'
            }`}>
            {f === 'tous' ? 'Tous' : typeLabels[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Liste des mouvements */}
      <div className="space-y-2">
        {filteredMouvements.length === 0 ? (
          <div className="card p-12 text-center text-dark-400">
            <History className="w-12 h-12 mx-auto mb-3 text-dark-300" />
            <p className="font-medium">Aucun mouvement de stock</p>
            <p className="text-sm mt-1">Enregistrez votre premier mouvement</p>
          </div>
        ) : (
          filteredMouvements.map(m => {
            const typeInfo = typeLabels[m.type_mouvement] || typeLabels.entree
            const TypeIcon = typeInfo.icon
            return (
              <div key={m.id} className="card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-dark-900 text-sm">{m.produit_nom}</span>
                    <span className={`badge text-[10px] ${typeInfo.color}`}>{typeInfo.label}</span>
                  </div>
                  <p className="text-xs text-dark-500 mt-0.5">
                    {m.motif || '—'} {m.reference && `— Ref: ${m.reference}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${m.type_mouvement === 'entree' ? 'text-success-600' : m.type_mouvement === 'sortie' ? 'text-danger-600' : 'text-primary-600'}`}>
                    {m.type_mouvement === 'entree' ? '+' : m.type_mouvement === 'sortie' ? '-' : ''}
                    {m.quantite}
                  </p>
                  <p className="text-[10px] text-dark-400">
                    {m.stock_avant} → {m.stock_apres}
                  </p>
                </div>
                <p className="text-[10px] text-dark-400">
                  {new Date(m.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Modal mouvement */}
      {showMouvement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">Nouveau mouvement de stock</h3>
            </div>
            <form onSubmit={handleMouvement} className="p-6 space-y-4">
              <div>
                <label className="input-label">Produit *</label>
                <select value={mouvementForm.produit_id} onChange={e => setMouvementForm({ ...mouvementForm, produit_id: e.target.value })} className="select" required>
                  <option value="">Selectionner un produit</option>
                  {state.produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Type de mouvement *</label>
                <div className="flex gap-2 flex-wrap">
                  {['entree', 'sortie', 'ajustement', 'inventaire'].map(type => (
                    <button key={type} type="button"
                      onClick={() => setMouvementForm({ ...mouvementForm, type_mouvement: type })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        mouvementForm.type_mouvement === type ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Quantite *</label>
                <input type="number" value={mouvementForm.quantite} onChange={e => setMouvementForm({ ...mouvementForm, quantite: e.target.value })} className="input" min="1" required />
              </div>
              <div>
                <label className="input-label">Motif</label>
                <input type="text" value={mouvementForm.motif} onChange={e => setMouvementForm({ ...mouvementForm, motif: e.target.value })} className="input" placeholder="Reception commande, vente..." />
              </div>
              <div>
                <label className="input-label">Reference</label>
                <input type="text" value={mouvementForm.reference} onChange={e => setMouvementForm({ ...mouvementForm, reference: e.target.value })} className="input" placeholder="BC-001, FAC-2026..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMouvement(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal transfert */}
      {showTransfert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">Transfert de stock</h3>
            </div>
            <form onSubmit={handleTransfert} className="p-6 space-y-4">
              <div>
                <label className="input-label">Produit *</label>
                <select value={transfertForm.produit_id} onChange={e => setTransfertForm({ ...transfertForm, produit_id: e.target.value })} className="select" required>
                  <option value="">Selectionner un produit</option>
                  {state.produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Quantite *</label>
                <input type="number" value={transfertForm.quantite} onChange={e => setTransfertForm({ ...transfertForm, quantite: e.target.value })} className="input" min="1" required />
              </div>
              <div>
                <label className="input-label">Motif</label>
                <input type="text" value={transfertForm.motif} onChange={e => setTransfertForm({ ...transfertForm, motif: e.target.value })} className="input" placeholder="Transfert vers succursale..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTransfert(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Transférer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
