import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { FolderOpen, Upload, Download, Trash2, File as FileIcon, Loader2, Plus, FileText, Receipt, Package, CreditCard } from 'lucide-react'
import { documentsAPI } from '../../utils/api'
import DocumentForm from './DocumentForm'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

function formatTaille(octets) {
  if (octets >= 1024 * 1024) return (octets / (1024 * 1024)).toFixed(1) + ' Mo'
  if (octets >= 1024) return (octets / 1024).toFixed(0) + ' Ko'
  return octets + ' o'
}

export default function Documents() {
  const { refresh, state } = useApp()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [typeSelectionne, setTypeSelectionne] = useState(null)
  const [historique, setHistorique] = useState(() => {
    return JSON.parse(localStorage.getItem('koleya_documents') || '[]')
  })
  const fileRef = useRef(null)

  const charger = async () => {
    setLoading(true)
    try {
      setDocs(await documentsAPI.list())
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10 Mo).')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result
      const mime = file.type || 'application/octet-stream'
      const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : ''
      try {
        await documentsAPI.upload(file.name, mime, file.size, base64)
        await charger()
        setMsg('Document téléversé ✓')
      } catch (err) {
        setMsg(err.message || "Échec de l'upload")
      }
      setTimeout(() => setMsg(''), 3000)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const supprimer = async (doc) => {
    if (!confirm(`Supprimer « ${doc.nom} » ?`)) return
    await documentsAPI.delete(doc.id)
    charger()
  }

  const totalTaille = docs.reduce((s, d) => s + d.taille, 0)

  const handleGenererDocument = (data) => {
    const doc = {
      id: Date.now().toString(),
      ...data,
      entreprise_nom: state.entreprise?.nom,
      cree_le: new Date().toISOString(),
    }
    const updated = [doc, ...historique]
    localStorage.setItem('koleya_documents', JSON.stringify(updated))
    setHistorique(updated)
    setShowForm(false)
    setTypeSelectionne(null)
    setMsg(`Document ${data.numero} genere avec succes`)
    setTimeout(() => setMsg(''), 3000)
  }

  const TYPES_DOCS = [
    { id: 'facture', label: 'Facture', icon: FileText },
    { id: 'facture_fiscale', label: 'Facture fiscale', icon: FileText },
    { id: 'facture_proforma', label: 'Facture proforma', icon: FileText },
    { id: 'recu', label: 'Recu', icon: Receipt },
    { id: 'recu_vente', label: 'Recu de vente', icon: Receipt },
    { id: 'recu_caisse', label: 'Recu de caisse', icon: Receipt },
    { id: 'devis', label: 'Devis', icon: FileText },
    { id: 'note_credit', label: 'Note de credit', icon: CreditCard },
    { id: 'bon_commande', label: 'Bon de commande', icon: Package },
    { id: 'bon_livraison', label: 'Bon de livraison', icon: Package },
  ]

  const counts = {}
  historique.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1 })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary-600" />
        <h1 className="page-title">Documents</h1>
      </div>
      <p className="text-sm text-dark-500">Generez des factures, recus, devis, bons et notes de credit avec des templates professionnels, ou televersez vos propres fichiers.</p>

      {msg && <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-2 text-sm text-success-700">{msg}</div>}

      {/* Generer des documents */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-dark-900 mb-3">Generer un document</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TYPES_DOCS.map(dt => (
            <button key={dt.id}
              onClick={() => { setTypeSelectionne(dt.id); setShowForm(true) }}
              className="card-hover p-3 text-center">
              <dt.icon className="w-6 h-6 mx-auto mb-1 text-primary-600" />
              <p className="text-xs font-medium text-dark-900">{dt.label}</p>
              <p className="text-[10px] text-dark-400">{counts[dt.id] || 0} genere(s)</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 text-sm text-dark-600">
          <span><strong className="text-dark-900">{docs.length}</strong> document(s)</span>
          <span className="text-dark-300">·</span>
          <span>{formatTaille(totalTaille)} au total</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn-primary">
            <Upload className="w-4 h-4" />
            Téléverser
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Nom du document</th>
              <th>Type</th>
              <th>Taille</th>
              <th>Ajouté le</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="font-medium">
                  <span className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-primary-500" />
                    {d.nom}
                  </span>
                </td>
                <td className="text-dark-500 text-sm">{d.type_mime || '—'}</td>
                <td className="text-dark-600 text-sm">{formatTaille(d.taille)}</td>
                <td className="text-dark-600 text-sm">{new Date(d.cree_le).toLocaleDateString('fr-FR')}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => documentsAPI.download(d.id, d.nom)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Télécharger">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => supprimer(d)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-dark-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                  Aucun document. Cliquez sur « Téléverser » pour ajouter vos fichiers.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-dark-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Historique des documents generes */}
      {historique.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="text-base font-semibold text-dark-900">Documents generes ({historique.length})</h3>
          </div>
          <div className="divide-y divide-dark-100">
            {historique.slice(0, 15).map(d => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between hover:bg-dark-50/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-dark-900">{d.numero}</p>
                    <p className="text-xs text-dark-500">{d.destinataire_nom || '—'} — {new Date(d.cree_le).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-50 text-primary-700">{d.type?.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold">{formatFCFA(d.totalTTC || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal DocumentForm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl my-8">
            <div className="px-6 py-4 border-b border-dark-100 flex justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-dark-900">
                {typeSelectionne ? `Nouveau ${TYPES_DOCS.find(d => d.id === typeSelectionne)?.label || 'document'}` : 'Nouveau document'}
              </h3>
              <button onClick={() => { setShowForm(false); setTypeSelectionne(null) }} className="p-1 rounded-lg hover:bg-dark-100">
                <span className="text-dark-400"><span className="sr-only">Fermer</span>X</span>
              </button>
            </div>
            <div className="p-6">
              <DocumentForm onGenerer={handleGenererDocument} typeInitial={typeSelectionne || 'facture'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}