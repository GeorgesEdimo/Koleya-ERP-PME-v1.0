import { useState, useEffect, useCallback, useRef } from 'react'
import { rechercheAPI } from '../../utils/apiRecherche'

/**
 * Hook de recherche globale avec debounce, tri, pagination.
 * Retourne : { resultats, loading, erreur, total, page, limit, tri, setTri, refetch }
 */
export default function useRecherche(options = {}) {
  const {
    q: initialQ = '',
    module: initialModule = null,
    statut: initialStatut = null,
    page: initialPage = 1,
    limit: initialLimit = 20,
    debounceMs = 300,
    enabled = true,
  } = options

  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [tri, setTri] = useState({ champ: null, sens: 'asc' }) // 'asc' | 'desc'

  const qRef = useRef(initialQ)
  const moduleRef = useRef(initialModule)
  const statutRef = useRef(initialStatut)
  const debounceTimerRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Fonction de fetch avec AbortController (annule la requête précédente)
  const refetch = useCallback(async () => {
    if (!enabled) return

    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setErreur(null)

    const params = {
      q: qRef.current,
      module: moduleRef.current,
      statut: statutRef.current,
      page,
      limit,
      tri_champ: tri.champ,
      tri_sens: tri.sens,
    }

    try {
      const data = await rechercheAPI.search(params)
      if (!abortControllerRef.current.signal.aborted) {
        setResultats(data.resultats || [])
        setTotal(data.total || 0)
        setPage(data.page || page)
        setLimit(data.limit || limit)
      }
    } catch (e) {
      if (!abortControllerRef.current.signal.aborted) {
        setErreur(e.message || 'Erreur de recherche')
        setResultats([])
        setTotal(0)
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) setLoading(false)
    }
  }, [page, limit, tri.champ, tri.sens, enabled])

  // Debounced search quand q/module/statut changent
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setPage(1) // reset page à chaque nouvelle recherche
      refetch()
    }, debounceMs)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [qRef.current, moduleRef.current, statutRef.current, refetch, debounceMs])

  // Refetch quand page/limit/tri changent (sans debounce)
  useEffect(() => {
    refetch()
  }, [refetch])

  // Exposeurs pour mise à jour externe (ex: input onChange)
  const setQ = useCallback((val) => { qRef.current = val }, [])
  const setModule = useCallback((val) => { moduleRef.current = val }, [])
  const setStatut = useCallback((val) => { statutRef.current = val }, [])

  // Nettoyage
  useEffect(() => {
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort() }
  }, [])

  return {
    resultats,
    loading,
    erreur,
    total,
    page,
    limit,
    tri,
    setTri,
    refetch,
    setQ,
    setModule,
    setStatut,
    setPage,
    setLimit,
  }
}