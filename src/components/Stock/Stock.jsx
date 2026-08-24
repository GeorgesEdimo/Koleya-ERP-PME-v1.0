import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Plus, Package, AlertTriangle, Search, Edit3, Trash2,
  TrendingDown, TrendingUp, BarChart3, Filter, Download, Image, QrCode
} from 'lucide-react'
import { generateTablePDF } from '../Facturation/pdfGenerator'
import { genererQRProduit } from '../../utils/qrcode'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function Stock() {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [recherche, setRecherche] = useState('')
  const { canExport } = useAbonnement()

  const handleExportPDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    await generateTablePDF({
      titre: 'État du stock',
      columns: [
        { header: 'Produit', key: 'nom' },
        { header: 'Référence', key: 'reference' },
        { header: 'Catégorie', key: 'categorie' },
        { header: "Prix d'achat", key: 'prixAchat', format: formatFCFA },
        { header: 'Prix de vente', key: 'prixVente', format: formatFCFA },
        { header: 'Stock', key: 'stock' },
        { header: 'Stock min', key: 'stockMin' },
        { header: 'Valeur', key: 'prixAchat', format: (v, r) => formatFCFA(r.stock * r.prixAchat) },
      ],
      rows: state.produits,
      entreprise: state.entreprise,
      filename: 'stock',
    })
  }
  const [categorie, setCategorie] = useState('toutes')
  const [showAjuster, setShowAjuster] = useState(null)

  const [form, setForm] = useState({
    nom: '', reference: '', categorie: 'Fournitures', stock: '', stockMin: '',
    prixAchat: '', prixVente: '', fournisseur: '', photo: null, codeBarres: ''
  })

  const categories = ['toutes', ...new Set(state.produits.map(p => p.categorie))]

  const produits = state.produits
    .filter(p => {
      if (categorie !== 'toutes' && p.categorie !== categorie) return false
      if (recherche) {
        const q = recherche.toLowerCase()
        return p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)
      }
      return true
    })

  const valeurStock = state.produits.reduce((s, p) => s + (p.stock * p.prixAchat), 0)
  const alertesStock = state.produits.filter(p => p.stock <= p.stockMin)
  const nbProduits = state.produits.length

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom || !form.reference) return

    const produit = {
      ...form,
      stock: parseInt(form.stock) || 0,
      stockMin: parseInt(form.stockMin) || 0,
      photo: form.photo || null,
      codeBarres: form.codeBarres || '',
      prixAchat: parseInt(form.prixAchat) || 0,
      prixVente: parseInt(form.prixVente) || 0,
    }

    if (editId) {
      dispatch({ type: 'UPDATE_PRODUIT', payload: { id: editId, ...produit } })
    } else {
      dispatch({ type: 'ADD_PRODUIT', payload: produit })
    }
    resetForm()
  }

  const resetForm = () => {
    setForm({ nom: '', reference: '', categorie: 'Fournitures', stock: '', stockMin: '', prixAchat: '', prixVente: '', fournisseur: '', photo: null, codeBarres: '' })
    setEditId(null)
    setShowModal(false)
  }

  const handleEdit = (produit) => {
    setForm({
      nom: produit.nom,
      reference: produit.reference,
      categorie: produit.categorie,
      stock: produit.stock,
      stockMin: produit.stockMin,
      prixAchat: produit.prixAchat,
      prixVente: produit.prixVente,
      fournisseur: produit.fournisseur || '',
      photo: produit.photo || null,
      codeBarres: produit.codeBarres || '',
    })
    setEditId(produit.id)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer ce produit ?')) {
      dispatch({ type: 'DELETE_PRODUIT', payload: id })
    }
  }

  const handleAjuster = (produitId) => {
    const qte = prompt('Quantité à ajuster (négatif pour sortie, positif pour entrée):')
    if (qte && !isNaN(parseInt(qte))) {
      dispatch({ type: 'AJUSTER_STOCK', payload: { id: produitId, quantite: parseInt(qte) } })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Produits</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{nbProduits}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">Valeur stock</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(valeurStock)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-danger-600" />
            </div>
            <span className="text-xs text-dark-500">Alertes stock</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{alertesStock.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Marges moyennes</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">
            {state.produits.length > 0
              ? Math.round(state.produits.reduce((s, p) => s + ((p.prixVente - p.prixAchat) / p.prixAchat * 100), 0) / state.produits.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categorie === cat ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-dark-200 hover:bg-dark-50'
              }`}
            >
              {cat === 'toutes' ? 'Toutes' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="input pl-9 w-48" />
          </div>
          <button onClick={handleExportPDF} className="btn-secondary" title="Exporter la liste du stock en PDF">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Référence</th>
              <th>Catégorie</th>
              <th>Prix d’achat</th>
              <th>Prix de vente</th>
              <th>Stock</th>
              <th>Stock min</th>
              <th>Valeur</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.photo ? (
                      <img src={p.photo} alt="" className="w-8 h-8 rounded object-cover border border-dark-200" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-dark-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-dark-400" />
                      </div>
                    )}
                    {p.nom}
                  </div>
                </td>
                <td className="text-dark-600 text-sm font-mono">{p.reference}</td>
                <td><span className="badge bg-primary-50 text-primary-700">{p.categorie}</span></td>
                <td>{formatFCFA(p.prixAchat)}</td>
                <td className="font-medium">{formatFCFA(p.prixVente)}</td>
                <td>
                  <span className={`font-semibold ${p.stock <= p.stockMin ? 'text-danger-600' : 'text-success-600'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="text-dark-500">{p.stockMin}</td>
                <td className="font-medium">{formatFCFA(p.stock * p.prixAchat)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleAjuster(p.id)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Ajuster stock">
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => {
                      const url = genererQRProduit(p)
                      window.open(url, '_blank')
                    }} className="p-1.5 rounded-lg hover:bg-accent-50 text-accent-600" title="QR Code">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500" title="Modifier">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {produits.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-12 text-dark-400">
                  <Package className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                  <p className="font-medium">Aucun produit enregistré</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">{editId ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="input-label">Nom du produit *</label>
                  <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="input-label">Référence *</label>
                  <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="input-label">Catégorie</label>
                  <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="select">
                    <option>Fournitures</option>
                    <option>Informatique</option>
                    <option>Alimentation</option>
                    <option>Équipement</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Prix d’achat (FCFA)</label>
                  <input type="number" value={form.prixAchat} onChange={(e) => setForm({ ...form, prixAchat: e.target.value })} className="input" min="0" />
                </div>
                <div>
                  <label className="input-label">Prix de vente (FCFA)</label>
                  <input type="number" value={form.prixVente} onChange={(e) => setForm({ ...form, prixVente: e.target.value })} className="input" min="0" />
                </div>
                <div>
                  <label className="input-label">Stock actuel</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" min="0" />
                </div>
                <div>
                  <label className="input-label">Stock minimum</label>
                  <input type="number" value={form.stockMin} onChange={(e) => setForm({ ...form, stockMin: e.target.value })} className="input" min="0" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Fournisseur</label>
                  <input type="text" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Code-barres</label>
                  <input type="text" value={form.codeBarres} onChange={(e) => setForm({ ...form, codeBarres: e.target.value })} className="input" placeholder="Code-barres du produit (optionnel)" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Photo du produit</label>
                  <p className="text-[10px] text-dark-400 mb-1">Image du produit (max 2 Mo, JPG/PNG)</p>
                  <div className="flex items-center gap-3">
                    {form.photo ? (
                      <div className="relative">
                        <img src={form.photo} alt="Photo" className="h-16 w-16 object-cover rounded-lg border border-dark-200" />
                        <button onClick={() => setForm({ ...form, photo: null })} className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white rounded-full text-[10px] flex items-center justify-center">x</button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 border-2 border-dashed border-dark-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                        <Image className="w-5 h-5 text-dark-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files[0]
                          if (!file) return
                          if (file.size > 2 * 1024 * 1024) { alert('Image trop volumineuse (max 2 Mo)'); return }
                          const reader = new FileReader()
                          reader.onload = (ev) => setForm({ ...form, photo: ev.target.result })
                          reader.readAsDataURL(file)
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
