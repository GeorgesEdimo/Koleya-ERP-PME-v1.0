import React, { useState, useEffect, useMemo } from 'react'
import { rechercheAPI } from '../../utils/apiRecherche'

/**
 * Timeline verticale (stepper) de l'historique d'un document.
 *
 * Props :
 *  - evenements : [] optionnel (si fourni, on ne fetch pas)
 *  - module : string (si fourni avec documentId, charge l'historique via l'API)
 *  - documentId : UUID
 */
const COULEURS = {
  creation: 'bg-primary-600',     // bleu
  envoi: 'bg-accent-500',         // jaune/orange
  validation: 'bg-success-500',   // vert
  annulation: 'bg-danger-500',    // rouge
}

function formatDateFr(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function TimelineHistorique({ evenements: evenementsProp, module, documentId }) {
  const [evenements, setEvenements] = useState(evenementsProp || [])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Si module + documentId fournis, on charge via l'API
  const charger = useMemo(
    () => async () => {
      if (evenementsProp || !(module && documentId)) return
      setLoading(true)
      setErreur(null)
      try {
        const data = await rechercheAPI.historique({ module, document_id: documentId })
        setEvenements(data.evenements || [])
      } catch (e) {
        setErreur(e.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    },
    [evenementsProp, module, documentId]
  )

  useEffect(() => {
    charger()
  }, [charger])

  // evenementsProp peut changer en cours de route
  useEffect(() => {
    if (evenementsProp) setEvenements(evenementsProp)
  }, [evenementsProp])

  if (loading) {
    return <div className="text-sm text-dark-500 py-4">Chargement de l’historique…</div>
  }
  if (erreur) {
    return <div className="rounded-lg bg-danger-50 text-danger-700 px-3 py-2 text-sm">{erreur}</div>
  }
  if (evenements.length === 0) {
    return <div className="text-sm text-dark-500 py-4">Aucun événement enregistré.</div>
  }

  return (
    <ol className="relative border-l border-dark-200 ml-3 space-y-5">
      {evenements.map((ev, i) => {
        const couleur = COULEURS[ev.action] || 'bg-dark-400'
        return (
          <li key={ev.id || i} className="ml-6">
            <span
              className={`absolute -left-[9px] flex h-4 w-4 rounded-full ring-4 ring-white ${couleur}`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-dark-900">{ev.action}</span>
              {ev.statut_avant !== undefined && ev.statut_avant !== null && (
                <span className="text-xs text-dark-500">
                  {ev.statut_avant || '—'} → <span className="font-medium text-dark-700">{ev.statut_apres || '—'}</span>
                </span>
              )}
            </div>
            {ev.details && <p className="text-sm text-dark-600 mt-0.5">{ev.details}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-dark-500">
              <span>{formatDateFr(ev.date)}</span>
              {ev.utilisateur_id && <span>· par {ev.utilisateur_id}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}