import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Plus, CreditCard, AlertTriangle, CheckCircle, Clock,
  DollarSign, Search, Trash2, Send, Bell, Download
} from 'lucide-react'
import { generateTablePDF } from '../Facturation/pdfGenerator'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function CreditClient() {
  const { state, dispatch } = useApp()
  const { canExport } = useAbonnement()
  const [showModal, setShowModal] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filter, setFilter] = useState('tous')

  const [form, setForm] = useState({
    clientId: '',
    montantTotal: '',
    echeance: '',
    description: '',
    methodePaiement: 'Mobile Money',
  })

  const [paiementForm, setPaiementForm] = useState({
    montant: '',
    methode: 'Mobile Money',
  })

  const credits = state.credits
    .filter(c => {
      if (filter === 'en_cours' && c.statut !== 'en_cours') return false
      if (filter === 'en_retard' && c.statut !== 'en_retard') return false
      if (filter === 'paye' && c.statut !== 'paye') return false
      if (recherche) {
        return c.clientNom.toLowerCase().includes(recherche.toLowerCase())
      }
      return true
    })
    .sort((a, b) => new Date(b.dateVente) - new Date(a.dateVente))

  const totalCredits = state.credits.reduce((s, c) => s + c.montantTotal, 0)
  const totalPaye = state.credits.reduce((s, c) => s + c.montantPaye, 0)
  const totalReste = state.credits.reduce((s, c) => s + c.reste, 0)
  const nbEnRetard = state.credits.filter(c => c.statut === 'en_retard').length

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.clientId || !form.montantTotal) return
    const client = state.clients.find(c => c.id === form.clientId)
    if (!client) return

    dispatch({
      type: 'ADD_CREDIT',
      payload: {
        clientId: form.clientId,
        clientNom: client.nom,
        montantTotal: parseInt(form.montantTotal),
        echeance: form.echeance || new Date().toISOString().slice(0, 10),
        description: form.description,
        methodePaiement: form.methodePaiement,
      }
    })
    setShowModal(false)
    setForm({ clientId: '', montantTotal: '', echeance: '', description: '', methodePaiement: 'Mobile Money' })
  }

  const handlePayer = (creditId) => {
    const credit = state.credits.find(c => c.id === creditId)
    if (!credit) return
    const montant = prompt(`Montant reçu de ${credit.clientNom}:\nReste: ${formatFCFA(credit.reste)}`, credit.reste)
    if (montant && !isNaN(parseInt(montant))) {
      dispatch({
        type: 'PAYER_CREDIT',
        payload: { id: creditId, montant: parseInt(montant), methode: 'Mobile Money' }
      })
    }
  }

  const handleRelancer = (credit) => {
    alert(`📱 SMS envoyé à ${credit.clientNom}:\n\n"Bonjour, nous vous rappelons votre dette de ${formatFCFA(credit.reste)}. Merci de régulariser votre situation."\n\n(Fonctionnalité SMS à connecter)`)
  }

  const handleExportPDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    const statutLabel = { en_cours: 'En cours', en_retard: 'En retard', paye: 'Payé' }
    await generateTablePDF({
      titre: 'Liste des crédits clients',
      columns: [
        { header: 'Client', key: 'clientNom' },
        { header: 'Description', key: 'description' },
        { header: 'Date de vente', key: 'dateVente' },
        { header: 'Échéance', key: 'echeance' },
        { header: 'Montant', key: 'montantTotal', format: formatFCFA },
        { header: 'Payé', key: 'montantPaye', format: formatFCFA },
        { header: 'Reste', key: 'reste', format: formatFCFA },
        { header: 'Statut', key: 'statut', format: (v) => statutLabel[v] || v },
      ],
      rows: credits,
      entreprise: state.entreprise,
      filename: 'credits',
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Total dettes</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{formatFCFA(totalCredits)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">Recouvré</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(totalPaye)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-danger-600" />
            </div>
            <span className="text-xs text-dark-500">En retard</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{nbEnRetard}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Reste à recouvrer</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(totalReste)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1">
          {['tous', 'en_cours', 'en_retard', 'paye'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
              }`}
            >
              {tab === 'tous' ? 'Tous' : tab === 'en_cours' ? 'En cours' : tab === 'en_retard' ? 'En retard' : 'Payés'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="input pl-9 w-48"
            />
          </div>
          <button onClick={handleExportPDF} className="btn-secondary" title="Exporter la liste des crédits en PDF">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau crédit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Description</th>
              <th>Date de vente</th>
              <th>Échéance</th>
              <th>Montant</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.clientNom}</td>
                <td className="text-dark-600 text-sm">{c.description || '—'}</td>
                <td className="text-dark-600">{new Date(c.dateVente).toLocaleDateString('fr-FR')}</td>
                <td className={`text-dark-600 ${c.statut === 'en_retard' ? 'font-semibold text-danger-600' : ''}`}>
                  {new Date(c.echeance).toLocaleDateString('fr-FR')}
                </td>
                <td className="font-semibold">{formatFCFA(c.montantTotal)}</td>
                <td className="text-success-600">{formatFCFA(c.montantPaye)}</td>
                <td className={`font-semibold ${c.reste > 0 ? 'text-danger-600' : 'text-dark-400'}`}>
                  {formatFCFA(c.reste)}
                </td>
                <td>
                  <span className={`badge ${
                    c.statut === 'paye' ? 'badge-success' :
                    c.statut === 'en_retard' ? 'badge-danger' :
                    'badge-warning'
                  }`}>
                    {c.statut === 'paye' ? 'Payé' : c.statut === 'en_retard' ? 'En retard' : 'En cours'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {c.reste > 0 && (
                      <>
                        <button onClick={() => handleRelancer(c)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Relancer">
                          <Bell className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePayer(c.id)} className="p-1.5 rounded-lg hover:bg-success-50 text-success-600" title="Enregistrer paiement">
                          <DollarSign className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {credits.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-12 text-dark-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                  <p className="font-medium">Aucun crédit enregistré</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nouveau crédit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">Nouveau crédit client</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="select" required>
                  <option value="">Sélectionner un client</option>
                  {state.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Vente du jour, marchandises..." />
              </div>
              <div>
                <label className="input-label">Montant total (FCFA) *</label>
                <input type="number" value={form.montantTotal} onChange={(e) => setForm({ ...form, montantTotal: e.target.value })} className="input" min="0" required />
              </div>
              <div>
                <label className="input-label">Échéance</label>
                <input type="date" value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} className="input" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
