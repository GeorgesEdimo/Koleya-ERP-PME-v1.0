import React, { useState, useEffect, useMemo } from 'react'
import { Download, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { rechercheAPI } from '../../utils/apiRecherche'

/**
 * Liste des archives (documents_archives) avec tableau, filtres, pagination.
 * Colonnes : module, type_document, numero, date, empreinte (badge), action (télécharger si pdf_url).
 */
export default function ListeArchives() {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [moduleFiltre, setModuleFiltre] = useState('')
  const [q, setQ] = useState('')

  const modules = useMemo(
    () => [...new Set(archives.map((a) => a.module).filter(Boolean))].sort(),
    [archives]
  )

  const charger = async () => {
    setLoading(true)
    setErreur(null)
    try {
      const data = await rechercheAPI.archives({ module: moduleFiltre, q, page, limit })
      setArchives(data.archives || [])
      setTotal(data.total || 0)
      setPage(data.page || page)
    } catch (e) {
      setErreur(e.message || 'Erreur de chargement')
      setArchives([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [moduleFiltre, q, page])
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const empreinteBadge = (e) => {
    if (!e.empreinte) return <span className="text-dark-400 text-xs">—</span>
    const short = e.empreinte.length > 18 ? e.empreinte.slice(0, 18) + '…' : e.empreinte
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-dark-100 text-dark-700 text-xs font-mono" title={e.empreinte}>
        {short}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Filtrer par module</label>
          <select className="select" value={moduleFiltre} onChange={(e) => setModuleFiltre(e.target.value)}>
            <option value="">Tous</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <label className="input-label">Recherche</label>
          <Search className="absolute left-3 top-[32px] h-4 w-4 text-dark-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Numéro, type…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {erreur && (
        <div className="rounded-lg bg-danger-50 text-danger-700 px-3 py-2 text-sm">{erreur}</div>
      )}

      {/* Tableau */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Type document</th>
              <th>Numéro</th>
              <th>Date archivage</th>
              <th>Empreinte SHA256</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center text-dark-500 py-6">Chargement…</td></tr>
            )}
            {!loading && archives.length === 0 && (
              <tr><td colSpan={6} className="text-center text-dark-500 py-6">Aucune archive</td></tr>
            )}
            {!loading && archives.map((a) => (
              <tr key={a.id}>
                <td><span className="badge badge-info">{a.module}</span></td>
                <td>{a.type_document || '—'}</td>
                <td className="font-medium">{a.numero || '—'}</td>
                <td>{new Date(a.cree_le).toLocaleDateString('fr-FR')}</td>
                <td>{empreinteBadge(a)}</td>
                <td className="text-right">
                  {a.pdf_url && (
                    <a
                      href={a.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-3 py-1.5 text-sm gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> Télécharger
                    </a>
                  )}
                  {!a.pdf_url && <span className="text-dark-400 text-sm">Pas de PDF</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-500">
          {total} archive(s) — page {page} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}