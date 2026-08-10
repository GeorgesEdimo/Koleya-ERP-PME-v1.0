import React, { useState, useMemo, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Users, Search, Plus, Edit3, Trash2, Download, Phone, Mail, MapPin, Upload
} from 'lucide-react'
import { generateTablePDF } from '../Facturation/pdfGenerator'
import ClientFormModal from './ClientFormModal'
import { clientsAPI } from '../../utils/api'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

export default function Clients() {
  const { state, dispatch, refresh } = useApp()
  const { canExport } = useAbonnement()
  const fileRef = useRef(null)
  const [recherche, setRecherche] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)

  // Solde dû par client (factures impayées + crédits en cours)
  const soldes = useMemo(() => {
    const m = {}
    state.factures.forEach((f) => {
      if (f.type === 'facture' && f.reste > 0) m[f.clientId] = (m[f.clientId] || 0) + f.reste
    })
    state.credits.forEach((c) => {
      if (['en_cours', 'en_retard'].includes(c.statut)) m[c.clientId] = (m[c.clientId] || 0) + c.reste
    })
    return m
  }, [state.factures, state.credits])

  const clients = state.clients.filter((c) =>
    !recherche.trim() ||
    c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.telephone || '').includes(recherche) ||
    (c.email || '').toLowerCase().includes(recherche.toLowerCase())
  )

  const totalDu = Object.values(soldes).reduce((s, v) => s + v, 0)

  const handleDelete = (c) => {
    if (confirm(`Supprimer le client « ${c.nom} » ?`)) {
      dispatch({ type: 'DELETE_CLIENT', payload: c.id })
    }
  }

  const handleExportPDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    await generateTablePDF({
      titre: 'Liste des clients',
      sousTitre: `${state.clients.length} client(s)`,
      columns: [
        { header: 'Nom', key: 'nom' },
        { header: 'Téléphone', key: 'telephone' },
        { header: 'Email', key: 'email' },
        { header: 'Adresse', key: 'adresse' },
        { header: 'Solde dû', key: 'id', format: (v, r) => formatFCFA(soldes[r.id] || 0) },
      ],
      rows: state.clients,
      entreprise: state.entreprise,
      filename: 'clients',
    })
  }

  // Import depuis un fichier CSV / carnet de contacts exporté
  const parseCSV = (text) => {
    const lignes = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lignes.length === 0) return []
    const sep = text.includes(';') ? ';' : ','
    let rows = lignes.map((l) => l.split(sep).map((c) => c.trim()))
    const first = rows[0]
    if (first && first[0] && first[0].toLowerCase() === 'nom') rows = rows.slice(1)
    return rows
      .map((r) => ({ nom: r[0] || '', telephone: r[1] || '', email: r[2] || '', adresse: r[3] || '' }))
      .filter((c) => c.nom)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const clients = parseCSV(text)
    if (clients.length === 0) {
      alert('Aucun client valide trouvé. Format attendu : nom;téléphone;email;adresse (une ligne par client).')
      e.target.value = ''
      return
    }
    try {
      const res = await clientsAPI.importMany(clients)
      if (res && typeof res.importes === 'number') {
        refresh()
        const note = res.ignores ? ` (${res.ignores} ignoré(s) : quota d'essai atteint)` : ''
        alert(`${res.importes} client(s) importé(s)${note}`)
      } else {
        alert(res?.error || "Échec de l'import")
      }
    } catch (err) {
      alert(err?.message || "Échec de l'import. Vérifiez le format du fichier.")
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Clients</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{state.clients.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <Download className="w-4 h-4 text-danger-600" />
            </div>
            <span className="text-xs text-dark-500">Total dû</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{formatFCFA(totalDu)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Avec téléphone</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{state.clients.filter((c) => c.telephone).length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">Avec email</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{state.clients.filter((c) => c.email).length}</p>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn-secondary" title="Importer des clients depuis un fichier CSV (carnet de contacts)">
            <Upload className="w-4 h-4" />
            Importer (CSV)
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
          <button onClick={handleExportPDF} className="btn-secondary" title="Exporter la liste des clients en PDF">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          <button onClick={() => { setEditClient(null); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>
              <th className="text-right">Solde dû</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {c.nom.charAt(0).toUpperCase()}
                    </span>
                    {c.nom}
                  </div>
                </td>
                <td className="text-dark-600 text-sm">{c.telephone || <span className="text-dark-300">—</span>}</td>
                <td className="text-dark-600 text-sm">{c.email || <span className="text-dark-300">—</span>}</td>
                <td className="text-dark-600 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-dark-300" />
                    {c.adresse || <span className="text-dark-300">—</span>}
                  </span>
                </td>
                <td className={`text-right font-semibold ${(soldes[c.id] || 0) > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                  {formatFCFA(soldes[c.id] || 0)}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => { setEditClient(c); setShowModal(true) }}
                      className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500 hover:text-primary-600"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-500 hover:text-danger-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-dark-400">
                  Aucun client. Cliquez sur « Nouveau client » pour en ajouter un.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale ajout / modification */}
      <ClientFormModal
        open={showModal}
        initial={editClient}
        onClose={() => { setShowModal(false); setEditClient(null) }}
        onCreated={(c) => { setEditClient(null) }}
      />
    </div>
  )
}