import React, { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Package, Plus, Search, DollarSign, Trash2,
  CheckCircle, Clock, X, Loader2, TrendingDown
} from 'lucide-react'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function Achats() {
  const { state, dispatch } = useApp()
  const [achats, setAchats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('toutes')
  const [recherche, setRecherche] = useState('')
  const [showCreer, setShowCreer] = useState(false)
  const [selectedAchat, setSelectedAchat] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('koleya_achats') || '[]'
    setAchats(JSON.parse(stored))
    setLoading(false)
  }, [])

  const saveAchats = (data) => {
    localStorage.setItem('koleya_achats', JSON.stringify(data))
    setAchats(data)
  }

  const [form, setForm] = useState({
    fournisseur: '',
    mode_paiement: 'especes',
    remise: 0,
    notes: '',
    items: [{ description: '', quantite: 1, prix_unitaire: 0, produit_id: null }],
  })

  const totalAchat = form.items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)
  const totalFinal = totalAchat - (form.remise || 0)

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantite: 1, prix_unitaire: 0, produit_id: null }] })
  }

  const removeItem = (idx) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
    }
  }

  const updateItem = (idx, field, value) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    setForm({ ...form, items })
  }

  const handleCreer = (e) => {
    e.preventDefault()
    if (!form.items.length || form.items.some(i => !i.description || i.prix_unitaire <= 0)) return

    const numero = `ACH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(achats.length + 1).padStart(3, '0')}`

    const achat = {
      id: Date.now().toString(),
      numero,
      fournisseur: form.fournisseur || 'Fournisseur inconnu',
      date: new Date().toISOString().slice(0, 10),
      mode_paiement: form.mode_paiement,
      remise: form.remise || 0,
      montant_total: totalAchat,
      montant_final: totalFinal,
      montant_paye: form.mode_paiement === 'especes' ? totalFinal : 0,
      reste: form.mode_paiement === 'especes' ? 0 : totalFinal,
      statut: form.mode_paiement === 'especes' ? 'payee' : 'en_cours',
      items: form.items,
      notes: form.notes,
      cree_le: new Date().toISOString(),
    }

    // Mettre a jour le stock
    form.items.forEach(item => {
      if (item.produit_id) {
        const produit = state.produits.find(p => p.id === parseInt(item.produit_id))
        if (produit) {
          dispatch({
            type: 'UPDATE_PRODUIT',
            payload: { id: parseInt(item.produit_id), stock: produit.stock + item.quantite, prixAchat: item.prix_unitaire }
          })
        }
      }
    })

    const newAchats = [achat, ...achats]
    saveAchats(newAchats)
    setForm({ fournisseur: '', mode_paiement: 'especes', remise: 0, notes: '', items: [{ description: '', quantite: 1, prix_unitaire: 0, produit_id: null }] })
    setShowCreer(false)
  }

  const filteredAchats = achats.filter(a => {
    if (filter === 'payee' && a.statut !== 'payee') return false
    if (filter === 'en_cours' && a.statut !== 'en_cours') return false
    if (recherche) {
      const q = recherche.toLowerCase()
      return a.fournisseur.toLowerCase().includes(q) || a.numero.toLowerCase().includes(q)
    }
    return true
  })

  const caTotal = achats.reduce((s, a) => s + a.montant_final, 0)
  const caPaye = achats.reduce((s, a) => s + a.montant_paye, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary-600" />
            <span className="text-xs text-dark-500">Total achats</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{achats.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-danger-600" />
            <span className="text-xs text-dark-500">Total depense</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{formatFCFA(caTotal)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            <span className="text-xs text-dark-500">Paye</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(caPaye)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent-600" />
            <span className="text-xs text-dark-500">Reste</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(caTotal - caPaye)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1">
          {['toutes', 'payee', 'en_cours'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
              }`}>
              {tab === 'toutes' ? 'Toutes' : tab === 'payee' ? 'Payees' : 'En cours'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" placeholder="Rechercher..." value={recherche}
              onChange={e => setRecherche(e.target.value)} className="input pl-9 w-48" />
          </div>
          <button onClick={() => setShowCreer(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Nouvel achat
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {loading ? (
          <div className="card p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
        ) : filteredAchats.length === 0 ? (
          <div className="card p-12 text-center text-dark-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-dark-300" />
            <p className="font-medium">Aucun achat enregistre</p>
          </div>
        ) : (
          filteredAchats.map(a => (
            <div key={a.id} className="card p-4 flex items-center justify-between hover:bg-dark-50/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-dark-900">{a.numero}</span>
                  <span className={`badge ${a.statut === 'payee' ? 'badge-success' : 'badge-warning'}`}>
                    {a.statut === 'payee' ? 'Paye' : 'En cours'}
                  </span>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  {a.fournisseur} — {new Date(a.date).toLocaleDateString('fr-FR')} — {a.items?.length || 0} article(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-dark-900">{formatFCFA(a.montant_final)}</p>
                <button onClick={() => setSelectedAchat(a)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500">
                  <DollarSign className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal creation */}
      {showCreer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-dark-100 flex justify-between">
              <h3 className="text-lg font-semibold text-dark-900">Nouvel achat</h3>
              <button onClick={() => setShowCreer(false)} className="p-1 rounded-lg hover:bg-dark-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Fournisseur</label>
                  <input type="text" value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} className="input" placeholder="Nom du fournisseur" />
                </div>
                <div>
                  <label className="input-label">Mode de paiement</label>
                  <select value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })} className="select">
                    <option value="especes">Especes</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    <option value="credit">A credit</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">Articles</label>
                  <button type="button" onClick={addItem} className="btn-secondary text-xs py-1 px-2">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select value={item.produit_id || ''} onChange={e => {
                      const p = state.produits.find(pr => pr.id === parseInt(e.target.value))
                      updateItem(idx, 'produit_id', e.target.value)
                      if (p) { updateItem(idx, 'description', p.nom); updateItem(idx, 'prix_unitaire', p.prixAchat) }
                    }} className="select w-40 text-xs">
                      <option value="">Manuel</option>
                      {state.produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                    <input type="text" placeholder="Description" value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)} className="input flex-1 text-xs" />
                    <input type="number" placeholder="Qte" value={item.quantite} min="1"
                      onChange={e => updateItem(idx, 'quantite', parseInt(e.target.value) || 1)} className="input w-16 text-xs" />
                    <input type="number" placeholder="Prix" value={item.prix_unitaire || ''} min="0"
                      onChange={e => updateItem(idx, 'prix_unitaire', parseInt(e.target.value) || 0)} className="input w-24 text-xs" />
                    <span className="text-xs font-semibold w-20 text-right">{formatFCFA(item.quantite * item.prix_unitaire)}</span>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-danger-50 text-danger-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Remise (FCFA)</label>
                  <input type="number" value={form.remise} min="0" onChange={e => setForm({ ...form, remise: parseInt(e.target.value) || 0 })} className="input" />
                </div>
                <div className="text-right pt-6">
                  <p className="text-xs text-dark-500">Total</p>
                  <p className="text-2xl font-bold text-dark-900 font-display">{formatFCFA(totalFinal)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreer(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer l’achat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal details */}
      {selectedAchat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-dark-100 flex justify-between">
              <h3 className="text-lg font-semibold text-dark-900">{selectedAchat.numero}</h3>
              <button onClick={() => setSelectedAchat(null)} className="p-1 rounded-lg hover:bg-dark-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-dark-500">Fournisseur</span><span className="font-medium">{selectedAchat.fournisseur}</span></div>
              <div className="flex justify-between text-sm"><span className="text-dark-500">Date</span><span>{new Date(selectedAchat.date).toLocaleDateString('fr-FR')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-dark-500">Mode de paiement</span><span className="capitalize">{selectedAchat.mode_paiement}</span></div>
              <hr className="my-2" />
              {selectedAchat.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{item.description} x{item.quantite}</span>
                  <span>{formatFCFA(item.quantite * item.prix_unitaire)}</span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatFCFA(selectedAchat.montant_final)}</span></div>
              <div className="flex justify-between text-sm"><span>Paye</span><span className="text-success-600">{formatFCFA(selectedAchat.montant_paye)}</span></div>
              <div className="flex justify-between text-sm"><span>Reste</span><span className={selectedAchat.reste > 0 ? 'text-danger-600 font-bold' : 'text-dark-400'}>{formatFCFA(selectedAchat.reste)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
