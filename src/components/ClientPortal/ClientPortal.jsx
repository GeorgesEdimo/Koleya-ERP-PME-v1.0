import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Receipt, FileText, CreditCard, Clock, CheckCircle,
  DollarSign, Search, Download, Phone, MessageCircle, UserPlus
} from 'lucide-react'
import { generateInvoicePDF } from '../Facturation/pdfGenerator'
import ClientFormModal from '../Clients/ClientFormModal'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function ClientPortal() {
  const { state, dispatch } = useApp()
  const [step, setStep] = useState('search') // search | portal
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientModal, setShowClientModal] = useState(false)

  const handleSearch = () => {
    if (!searchTerm.trim()) return
    const found = state.clients.find(c =>
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telephone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (found) {
      setSelectedClient(found)
      setStep('portal')
    } else {
      alert('Client non trouve. Verifiez le nom ou le telephone.')
    }
  }

  const handlePayInvoice = (facture) => {
    const montant = prompt(`Paiement facture ${facture.numero}:\nReste: ${formatFCFA(facture.reste)}\n\nEntrez le montant paye:`, facture.reste)
    if (montant && !isNaN(parseInt(montant))) {
      dispatch({
        type: 'PAYER_FACTURE',
        payload: { id: facture.id, montant: parseInt(montant) }
      })
      // Mettre a jour le client dans la vue
      setSelectedClient({ ...selectedClient })
    }
  }

  if (!selectedClient) {
    // Page de recherche
    const clientFactures = []
    const clientCredits = []

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900 font-display">Portail Client</h1>
            <p className="text-sm text-dark-500 mt-2">Consultez vos factures et suivez vos paiements</p>
          </div>

          <div className="card p-6">
            <label className="input-label">Rechercher votre compte</label>
            <p className="text-xs text-dark-400 mb-3">Entrez votre nom, telephone ou email</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input flex-1"
                placeholder="Nom, telephone ou email..."
              />
              <button onClick={handleSearch} className="btn-primary">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => setShowClientModal(true)} className="btn-secondary w-full mt-3 justify-center">
              <UserPlus className="w-4 h-4" />
              Nouveau client
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-dark-400">
            <p>Creez un compte ou contactez votre fournisseur pour acceder a votre portail.</p>
          </div>

          <ClientFormModal
            open={showClientModal}
            onClose={() => setShowClientModal(false)}
            onCreated={(clientCree) => {
              setSelectedClient(clientCree)
              setStep('portal')
            }}
          />
        </div>
      </div>
    )
  }

  // Portail du client
  const factures = state.factures.filter(f => f.clientId === selectedClient.id && f.type === 'facture')
  const devis = state.factures.filter(f => f.clientId === selectedClient.id && f.type === 'devis')
  const credits = state.credits.filter(c => c.clientId === selectedClient.id)

  const totalFactures = factures.reduce((s, f) => s + f.total, 0)
  const totalPaye = factures.reduce((s, f) => s + f.paye, 0)
  const totalReste = factures.reduce((s, f) => s + f.reste, 0)
  const creditsRestants = credits.filter(c => c.reste > 0).reduce((s, c) => s + c.reste, 0)

  return (
    <div className="space-y-6">
      {/* En-tete client */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-700">
                {selectedClient.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">{selectedClient.nom}</h2>
              <p className="text-sm text-dark-500">{selectedClient.telephone} {selectedClient.email && `— ${selectedClient.email}`}</p>
            </div>
          </div>
          <button onClick={() => { setSelectedClient(null); setStep('search') }} className="btn-secondary text-sm">
            Changer de client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <span className="text-xs text-dark-500">Factures</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{factures.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success-600" />
            <span className="text-xs text-dark-500">Total paye</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(totalPaye)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent-600" />
            <span className="text-xs text-dark-500">Reste a payer</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(totalReste)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-danger-600" />
            <span className="text-xs text-dark-500">Credits restants</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{formatFCFA(creditsRestants)}</p>
        </div>
      </div>

      {/* Factures */}
      <div className="card">
        <div className="px-5 py-4 border-b border-dark-100">
          <h3 className="text-base font-semibold text-dark-900">Mes factures</h3>
        </div>
        {factures.length === 0 ? (
          <div className="p-8 text-center text-dark-400 text-sm">Aucune facture</div>
        ) : (
          <div className="divide-y divide-dark-100">
            {factures.sort((a, b) => new Date(b.date) - new Date(a.date)).map(f => (
              <div key={f.id} className="px-5 py-4 flex items-center justify-between hover:bg-dark-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-dark-900">{f.numero}</span>
                    <span className={`badge text-[10px] ${
                      f.statut === 'payee' ? 'badge-success' :
                      f.statut === 'en_retard' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {f.statut === 'payee' ? 'Payee' : f.statut === 'en_retard' ? 'En retard' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 mt-1">
                    {new Date(f.date).toLocaleDateString('fr-FR')} — Echeance: {new Date(f.echeance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-dark-900">{formatFCFA(f.total)}</p>
                    {f.reste > 0 && (
                      <p className="text-xs text-danger-600">Reste: {formatFCFA(f.reste)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => generateInvoicePDF(f, state.entreprise)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500" title="Telecharger PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    {f.reste > 0 && (
                      <button onClick={() => handlePayInvoice(f)} className="btn-success text-xs py-1.5 px-3">
                        <DollarSign className="w-3.5 h-3.5" />
                        Payer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credits */}
      {credits.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="text-base font-semibold text-dark-900">Mes credits</h3>
          </div>
          <div className="divide-y divide-dark-100">
            {credits.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-[10px] ${
                      c.statut === 'paye' ? 'badge-success' :
                      c.statut === 'en_retard' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {c.statut === 'paye' ? 'Paye' : c.statut === 'en_retard' ? 'En retard' : 'En cours'}
                    </span>
                    <span className="text-xs text-dark-500">
                      Vente du {new Date(c.dateVente).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-dark-500 mt-1">{c.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-dark-900">{formatFCFA(c.montantTotal)}</p>
                  {c.reste > 0 && (
                    <p className="text-xs text-danger-600">Reste: {formatFCFA(c.reste)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devis en attente */}
      {devis.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="text-base font-semibold text-dark-900">Devis en attente</h3>
          </div>
          <div className="divide-y divide-dark-100">
            {devis.map(d => (
              <div key={d.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-dark-900">{d.numero}</span>
                  <p className="text-xs text-dark-500 mt-1">
                    {d.items.length} article(s) — {new Date(d.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-dark-900">{formatFCFA(d.total)}</p>
                  <button onClick={() => generateInvoicePDF(d, state.entreprise)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-dark-900 mb-3">Besoin d’aide ?</h3>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${state.entreprise.telephone}`} className="btn-secondary text-sm">
            <Phone className="w-4 h-4" />
            {state.entreprise.telephone || 'Appeler'}
          </a>
          <a href={`https://wa.me/${state.entreprise.telephone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
