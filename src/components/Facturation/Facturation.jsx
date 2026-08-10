import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Plus, Search, FileText, Filter, Download, Eye, Trash2,
  CheckCircle, Clock, AlertTriangle, Send, DollarSign
} from 'lucide-react'
import { generateInvoicePDF, generateTablePDF } from './pdfGenerator'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function Facturation() {
  const { state, dispatch } = useApp()
  const { canExport } = useAbonnement()
  const [onglet, setOnglet] = useState('toutes')
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('date-desc')

  const factures = state.factures
    .filter(f => {
      if (onglet === 'factures' && f.type !== 'facture') return false
      if (onglet === 'devis' && f.type !== 'devis') return false
      if (recherche) {
        const q = recherche.toLowerCase()
        return f.clientNom.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (tri === 'date-desc') return new Date(b.date) - new Date(a.date)
      if (tri === 'date-asc') return new Date(a.date) - new Date(b.date)
      if (tri === 'montant-desc') return b.total - a.total
      if (tri === 'montant-asc') return a.total - b.total
      return 0
    })

  const totalFactures = state.factures.filter(f => f.type === 'facture').reduce((s, f) => s + f.total, 0)
  const totalEncaisse = state.factures.filter(f => f.type === 'facture').reduce((s, f) => s + f.paye, 0)
  const totalImpaye = state.factures.filter(f => f.type === 'facture' && f.reste > 0).reduce((s, f) => s + f.reste, 0)
  const nbEnRetard = state.factures.filter(f => f.statut === 'en_retard').length

  const handlePayer = (factureId) => {
    const facture = state.factures.find(f => f.id === factureId)
    if (!facture) return
    const montant = prompt(`Montant reçu pour ${facture.numero}:\nReste: ${formatFCFA(facture.reste)}`, facture.reste)
    if (montant && !isNaN(parseInt(montant))) {
      dispatch({
        type: 'PAYER_FACTURE',
        payload: { id: factureId, montant: parseInt(montant) }
      })
    }
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer cette facture ?')) {
      dispatch({ type: 'DELETE_FACTURE', payload: id })
    }
  }

  const handlePDF = async (facture) => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    await generateInvoicePDF(facture, state.entreprise)
  }

  const handleExportListePDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    const statutLabel = {
      payee: 'Payée', en_retard: 'En retard', brouillon: 'Brouillon', en_attente: 'En attente',
    }
    await generateTablePDF({
      titre: onglet === 'devis' ? 'Liste des devis' : onglet === 'factures' ? 'Liste des factures' : 'Factures & devis',
      columns: [
        { header: 'Numéro', key: 'numero' },
        { header: 'Client', key: 'clientNom' },
        { header: 'Date', key: 'date' },
        { header: 'Échéance', key: 'echeance' },
        { header: 'Montant', key: 'total', format: formatFCFA },
        { header: 'Payé', key: 'paye', format: formatFCFA },
        { header: 'Reste', key: 'reste', format: formatFCFA },
        { header: 'Statut', key: 'statut', format: (v) => statutLabel[v] || v },
      ],
      rows: factures,
      entreprise: state.entreprise,
      filename: onglet === 'devis' ? 'devis' : 'factures',
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Total CA</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{formatFCFA(totalFactures)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">Encaissé</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(totalEncaisse)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Impayés</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(totalImpaye)}</p>
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
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1">
          {['toutes', 'factures', 'devis'].map((tab) => (
            <button
              key={tab}
              onClick={() => setOnglet(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                onglet === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
              }`}
            >
              {tab === 'toutes' ? 'Toutes' : tab === 'factures' ? 'Factures' : 'Devis'}
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

          <select value={tri} onChange={(e) => setTri(e.target.value)} className="select w-auto">
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="montant-desc">Montant ↓</option>
            <option value="montant-asc">Montant ↑</option>
          </select>

          <button onClick={handleExportListePDF} className="btn-secondary" title="Exporter la liste en PDF">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>

          <Link to="/app/facturation/nouvelle" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th>Échéance</th>
              <th>Montant</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-dark-400" />
                    <span className="font-medium text-dark-800">{f.numero}</span>
                  </div>
                </td>
                <td className="font-medium">{f.clientNom}</td>
                <td className="text-dark-600">{new Date(f.date).toLocaleDateString('fr-FR')}</td>
                <td className="text-dark-600">{new Date(f.echeance).toLocaleDateString('fr-FR')}</td>
                <td className="font-semibold">{formatFCFA(f.total)}</td>
                <td className="text-success-600">{formatFCFA(f.paye)}</td>
                <td className={`font-semibold ${f.reste > 0 ? 'text-danger-600' : 'text-dark-400'}`}>
                  {formatFCFA(f.reste)}
                </td>
                <td>
                  <span className={`badge ${
                    f.statut === 'payee' ? 'badge-success' :
                    f.statut === 'en_retard' ? 'badge-danger' :
                    f.statut === 'brouillon' ? 'bg-dark-100 text-dark-600' :
                    'badge-warning'
                  }`}>
                    {f.statut === 'payee' ? 'Payée' :
                     f.statut === 'en_retard' ? 'En retard' :
                     f.statut === 'brouillon' ? 'Brouillon' :
                     'En attente'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handlePDF(f)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500" title="PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    {f.type === 'facture' && f.reste > 0 && (
                      <button onClick={() => handlePayer(f.id)} className="p-1.5 rounded-lg hover:bg-success-50 text-success-600" title="Enregistrer paiement">
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {factures.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-12 text-dark-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                  <p className="font-medium">Aucune facture trouvée</p>
                  <p className="text-sm mt-1">Créez votre première facture pour commencer</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
