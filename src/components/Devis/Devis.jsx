import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Plus, Search, FileText, Download, Trash2, Send,
  ArrowRight, CheckCircle, Clock, Eye
} from 'lucide-react'
import { generateInvoicePDF, generateTablePDF } from '../Facturation/pdfGenerator'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function Devis() {
  const { state, dispatch, generateNumero } = useApp()
  const { canExport } = useAbonnement()
  const [recherche, setRecherche] = useState('')
  const [filter, setFilter] = useState('tous')

  const devis = state.factures
    .filter(f => {
      if (f.type !== 'devis') return false
      if (filter === 'brouillon' && f.statut !== 'brouillon') return false
      if (filter === 'envoye' && f.statut !== 'en_attente') return false
      if (filter === 'accepte' && f.statut !== 'payee') return false
      if (recherche) {
        const q = recherche.toLowerCase()
        return f.clientNom.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const nbTotal = state.factures.filter(f => f.type === 'devis').length
  const nbBrouillon = state.factures.filter(f => f.type === 'devis' && f.statut === 'brouillon').length
  const nbEnvoye = state.factures.filter(f => f.type === 'devis' && f.statut === 'en_attente').length
  const totalDevis = state.factures.filter(f => f.type === 'devis').reduce((s, f) => s + f.total, 0)

  const handleDelete = (id) => {
    if (confirm('Supprimer ce devis ?')) {
      dispatch({ type: 'DELETE_FACTURE', payload: id })
    }
  }

  const handlePDF = async (devisItem) => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    await generateInvoicePDF(devisItem, state.entreprise)
  }

  const handleExportListePDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    const statutLabel = { brouillon: 'Brouillon', en_attente: 'Envoyé', payee: 'Accepté' }
    await generateTablePDF({
      titre: 'Liste des devis',
      columns: [
        { header: 'Numéro', key: 'numero' },
        { header: 'Client', key: 'clientNom' },
        { header: 'Date', key: 'date' },
        { header: 'Échéance', key: 'echeance' },
        { header: 'Montant', key: 'total', format: formatFCFA },
        { header: 'Statut', key: 'statut', format: (v) => statutLabel[v] || v },
      ],
      rows: devis,
      entreprise: state.entreprise,
      filename: 'devis',
    })
  }

  const handleConvertToFacture = (devisItem) => {
    if (!confirm(`Convertir le devis ${devisItem.numero} en facture ?`)) return

    // Créer la facture
    const numeroFacture = generateNumero('facture')
    const facture = {
      ...devisItem,
      numero: numeroFacture,
      type: 'facture',
      statut: 'en_attente',
      paye: 0,
      reste: devisItem.total,
    }
    delete facture.id

    dispatch({ type: 'ADD_FACTURE', payload: facture })

    // Mettre à jour le devis comme accepté
    dispatch({
      type: 'UPDATE_FACTURE',
      payload: { id: devisItem.id, statut: 'payee' }
    })

    alert(`Devis converti en facture ${numeroFacture} !`)
  }

  const handleMarkSent = (devisItem) => {
    dispatch({
      type: 'UPDATE_FACTURE',
      payload: { id: devisItem.id, statut: 'en_attente' }
    })
  }

  const handleMarkAccepted = (devisItem) => {
    handleConvertToFacture(devisItem)
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
            <span className="text-xs text-dark-500">Total devis</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{nbTotal}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-dark-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-dark-600" />
            </div>
            <span className="text-xs text-dark-500">Brouillons</span>
          </div>
          <p className="text-xl font-bold text-dark-600 font-display">{nbBrouillon}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Envoyés</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{nbEnvoye}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">Valeur totale</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(totalDevis)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1">
          {['tous', 'brouillon', 'envoye', 'accepte'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
              }`}
            >
              {tab === 'tous' ? 'Tous' : tab === 'brouillon' ? 'Brouillons' : tab === 'envoye' ? 'Envoyés' : 'Acceptés'}
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
          <button onClick={handleExportListePDF} className="btn-secondary" title="Exporter la liste des devis en PDF">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          <Link to="/app/facturation/nouvelle/devis" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau devis
          </Link>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="space-y-3">
        {devis.map((d) => (
          <div key={d.id} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge bg-primary-50 text-primary-700">{d.numero}</span>
                  <span className={`badge ${
                    d.statut === 'brouillon' ? 'bg-dark-100 text-dark-600' :
                    d.statut === 'payee' ? 'badge-success' :
                    'badge-warning'
                  }`}>
                    {d.statut === 'brouillon' ? 'Brouillon' : d.statut === 'payee' ? 'Accepté' : 'Envoyé'}
                  </span>
                </div>
                <p className="font-semibold text-dark-900">{d.clientNom}</p>
                <p className="text-sm text-dark-500 mt-1">
                  {d.items.length} article(s) — {new Date(d.date).toLocaleDateString('fr-FR')} — Échéance : {new Date(d.echeance).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-dark-900 font-display">{formatFCFA(d.total)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handlePDF(d)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500" title="PDF">
                    <Download className="w-4 h-4" />
                  </button>

                  {d.statut === 'brouillon' && (
                    <button onClick={() => handleMarkSent(d)} className="p-2 rounded-lg hover:bg-accent-50 text-accent-600" title="Marquer envoyé">
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {d.statut !== 'payee' && (
                    <button onClick={() => handleConvertToFacture(d)} className="btn-success text-xs" title="Convertir en facture">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Convertir
                    </button>
                  )}

                  <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Détails articles (pliable) */}
            <details className="mt-3">
              <summary className="text-xs text-dark-400 cursor-pointer hover:text-dark-600">
                Voir les détails
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th className="text-center">Qté</th>
                      <th className="text-right">Prix unit.</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((item, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.description}</td>
                        <td className="text-center">{item.quantite}</td>
                        <td className="text-right">{formatFCFA(item.prixUnitaire)}</td>
                        <td className="text-right font-medium">{formatFCFA(item.quantite * item.prixUnitaire)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ))}

        {devis.length === 0 && (
          <div className="card p-12 text-center text-dark-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-dark-300" />
            <p className="font-medium">Aucun devis</p>
            <p className="text-sm mt-1">Créez votre premier devis pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}
