import React, { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import useRecherche from './useRecherche'

/**
 * Barre de recherche globale + filtres contextuels + tri colonnes + pagination.
 *
 * Props :
 *  - modulesDisponibles : string[] (liste des modules à proposer, défaut tous)
 *  - filtres : { statut?: [], type?: [], client?: [], employe?: [] } selects contextuels supplémentaires
 *  - colonnesTri : [{ champ, libelle }] options de tri
 *  - onSelectionner : (item) => void  remonte l'item cliqué
 *  - placeholder : string
 */
const MODULES_DEFAUT = [
  { valeur: '', libelle: 'Tous les modules' },
  { valeur: 'facture', libelle: 'Factures' },
  { valeur: 'devis', libelle: 'Devis' },
  { valeur: 'client', libelle: 'Clients' },
  { valeur: 'produit', libelle: 'Produits' },
  { valeur: 'employe', libelle: 'Employés' },
  { valeur: 'rh', libelle: 'RH' },
]

export default function RechercheFiltre({
  modulesDisponibles,
  filtres = {},
  colonnesTri = [],
  onSelectionner,
  placeholder = 'Rechercher un document, client, produit…',
}) {
  const [texte, setTexte] = useState('')
  const [module, setModule] = useState(modulesDisponibles?.[0]?.valeur ?? '')
  const [statut, setStatut] = useState('')
  const [filtreExtra, setFiltreExtra] = useState('') // client/employe/type selon contexte
  const [triChamp, setTriChamp] = useState(colonnesTri[0]?.champ || '')
  const [triSens, setTriSens] = useState('asc')

  const modules = useMemo(
    () => (modulesDisponibles ? [{ valeur: '', libelle: 'Tous les modules' }, ...modulesDisponibles.map((m) => ({ valeur: m, libelle: m }))] : MODULES_DEFAUT),
    [modulesDisponibles]
  )

  const { resultats, loading, erreur, total, page, limit, setQ, setModule: setModuleRecherche, setStatut: setStatutRecherche, setPage } = useRecherche({
    module: module || null,
    statut: statut || null,
  })

  // Synchro des champs texte vers le hook (debounce géré dans le hook)
  useEffect(() => { setQ(texte) }, [texte, setQ])
  useEffect(() => { setModuleRecherche(module || null) }, [module, setModuleRecherche])
  useEffect(() => { setStatutRecherche(statut || null) }, [statut, setStatutRecherche])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const basculerTri = (champ) => {
    if (triChamp === champ) {
      setTriSens((s) => (s === 'asc' ? 'desc' : 'asc'))
    } else {
      setTriChamp(champ)
      setTriSens('asc')
    }
  }

  const handleItemClick = (item) => {
    if (onSelectionner) onSelectionner(item)
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche + module + filtres contextuels */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="input-label">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500" />
            <input
              type="text"
              className="input pl-9"
              placeholder={placeholder}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Module</label>
          <select className="select" value={module} onChange={(e) => setModule(e.target.value)}>
            {modules.map((m) => (
              <option key={m.valeur || 'all'} value={m.valeur}>{m.libelle}</option>
            ))}
          </select>
        </div>

        {filtres.statut && filtres.statut.length > 0 && (
          <div>
            <label className="input-label">Statut</label>
            <select className="select" value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="">Tous</option>
              {filtres.statut.map((s) => (
                <option key={s.valeur} value={s.valeur}>{s.libelle}</option>
              ))}
            </select>
          </div>
        )}

        {(filtres.type || filtres.client || filtres.employe) && (
          <div>
            <label className="input-label">{filtres.type ? 'Type' : filtres.employe ? 'Employé' : 'Client'}</label>
            <select className="select" value={filtreExtra} onChange={(e) => setFiltreExtra(e.target.value)}>
              <option value="">Tous</option>
              {(filtres.type || filtres.client || filtres.employe).map((o) => (
                <option key={o.valeur} value={o.valeur}>{o.libelle}</option>
              ))}
            </select>
          </div>
        )}

        {colonnesTri.length > 0 && (
          <div>
            <label className="input-label">Trier par</label>
            <div className="flex gap-2">
              <select className="select" value={triChamp} onChange={(e) => setTriChamp(e.target.value)}>
                {colonnesTri.map((c) => (
                  <option key={c.champ} value={c.champ}>{c.libelle}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary px-3"
                onClick={() => basculerTri(triChamp)}
                title="Inverser le sens"
              >
                <ArrowUpDown className="h-4 w-4" />
                {triSens === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="rounded-lg bg-danger-50 text-danger-700 px-3 py-2 text-sm">{erreur}</div>
      )}

      {/* Résultats */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Résultat</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="text-center text-dark-500 py-6">Chargement…</td></tr>
            )}
            {!loading && resultats.length === 0 && (
              <tr><td colSpan={4} className="text-center text-dark-500 py-6">Aucun résultat</td></tr>
            )}
            {!loading && resultats.map((item, i) => (
              <tr key={item.id || i} className="cursor-pointer" onClick={() => handleItemClick(item)}>
                <td>
                  <span className="badge badge-info">{item.type_resultat}</span>
                </td>
                <td>
                  {item.nom || item.titre || item.numero || `${item.type_resultat} #${i + 1}`}
                  {item.client_nom && <div className="text-xs text-dark-500">{item.client_nom}</div>}
                </td>
                <td>{item.statut || '—'}</td>
                <td>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : (item.cree_le ? new Date(item.cree_le).toLocaleDateString('fr-FR') : '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-500">
          {total} résultat(s) — page {page} / {totalPages}
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