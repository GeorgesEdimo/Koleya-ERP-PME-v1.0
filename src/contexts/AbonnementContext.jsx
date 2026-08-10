import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { abonnementAPI } from '../utils/api'
import { useAuth } from './AuthContext'

const AbonnementContext = createContext()

export function AbonnementProvider({ children }) {
  const { user } = useAuth()
  const [abonnement, setAbonnement] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await abonnementAPI.statut()
      setAbonnement(data)
    } catch (e) {
      // En cas d'erreur réseau, on conserve le dernier état connu
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Compte à rebours actif : re-synchronise l'abonnement toutes les minutes
  useEffect(() => {
    if (!user) return
    const t = setInterval(() => refresh(), 60 * 1000)
    return () => clearInterval(t)
  }, [user, refresh])

  // Passage au plan payant (mock) puis mise à jour
  const payer = async (plan) => {
    await abonnementAPI.payer(plan)
    await refresh()
  }

  const isExpired = abonnement?.statut === 'expire'
  const isTrial = abonnement?.statut === 'essai'
  const canWrite = !isExpired
  const canExport = abonnement?.export_permis !== false
  const joursRestants = abonnement?.jours_restants ?? null

  // Consommation d'un module pendant l'essai : { actuel, plafond, reste } | null
  const quotaRestant = (type) => {
    if (!abonnement) return null
    const actuel = abonnement.compteurs?.[type] ?? 0
    const plafond = abonnement.quotas?.[type]
    if (plafond === undefined) return null
    return { actuel, plafond, reste: Math.max(0, plafond - actuel) }
  }

  // Verrou pour les boutons de création : { bloqué, raison, reste? } | null
  const verrouQuota = (type) => {
    if (!abonnement) return null
    if (isExpired) return { bloqué: true, raison: 'expire' }
    const q = quotaRestant(type)
    if (q && q.reste <= 0) return { bloqué: true, raison: 'quota', ...q }
    return { bloqué: false }
  }

  const value = {
    abonnement,
    loading,
    refresh,
    payer,
    isExpired,
    isTrial,
    canWrite,
    canExport,
    joursRestants,
    quotaRestant,
    verrouQuota,
  }

  return <AbonnementContext.Provider value={value}>{children}</AbonnementContext.Provider>
}

export function useAbonnement() {
  const context = useContext(AbonnementContext)
  if (!context) throw new Error('useAbonnement must be used within AbonnementProvider')
  return context
}
