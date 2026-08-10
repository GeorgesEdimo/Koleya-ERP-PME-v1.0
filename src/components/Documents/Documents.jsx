import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { FolderOpen, Upload, Download, Trash2, File as FileIcon, Loader2 } from 'lucide-react'
import { documentsAPI } from '../../utils/api'

function formatTaille(octets) {
  if (octets >= 1024 * 1024) return (octets / (1024 * 1024)).toFixed(1) + ' Mo'
  if (octets >= 1024) return (octets / 1024).toFixed(0) + ' Ko'
  return octets + ' o'
}

export default function Documents() {
  const { refresh } = useApp()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary-600" />
        <h1 className="page-title">Documents</h1>
      </div>
      <p className="text-sm text-dark-500">Téléversez vos documents administratifs : contrats, pièces, factures scannées… (PDF, images, Word, Excel, max 10 Mo)</p>

      {msg && <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-2 text-sm text-success-700">{msg}</div>}

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
    </div>
  )
}