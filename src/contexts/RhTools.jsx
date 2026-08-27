"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from './AppContext'
import { paieAPI, congesAPI, evaluationsAPI } from '../utils/api'

export function usePaie() {
  const { state, dispatch, loading, error, refresh } = useApp()
  const [stats, setStats] = useState(null)

  const calculerBulletin = useCallback(async (data) => {
    try {
      const res = await paieAPI.calculer(data)
      dispatch({ type: 'ADD_PAIE', payload: res })
      await refresh()
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch, refresh])

  const listerBulletins = useCallback(async (params = {}) => {
    try {
      const res = await paieAPI.lister(params)
      dispatch({ type: 'SET_PAIE', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  const consulterSolde = useCallback(async (employeId) => {
    try {
      const res = await paieAPI.lister({ employe_id: employeId })
      setStats(res.reduce((acc, b) => acc + b.salaire_net, 0))
      return res
    } catch (err) {
      throw err
    }
  }, [])

  return { stats, loading, error, calculerBulletin, listerBulletins, consulterSolde }
}

export function useConges() {
  const { state, dispatch, loading, error } = useApp()

  const soumettreDemande = useCallback(async (data) => {
    try {
      const res = await congesAPI.soumettre(data)
      dispatch({ type: 'ADD_CONGE', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  const listerDemandes = useCallback(async (params = {}) => {
    try {
      const res = await congesAPI.lister(params)
      dispatch({ type: 'SET_CONGE', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  const deciderDemande = useCallback(async (id, decision) => {
    try {
      const res = await congesAPI.decider(id, { statut: decision })
      dispatch({ type: 'UPDATE_CONGE', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  return { loading, error, soumettreDemande, listerDemandes, deciderDemande }
}

export function useEvaluations() {
  const { state, dispatch, loading, error } = useApp()

  const planifierEntretien = useCallback(async (data) => {
    try {
      const res = await evaluationsAPI.planifier(data)
      dispatch({ type: 'ADD_EVALUATION', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  const listerEvaluations = useCallback(async (params = {}) => {
    try {
      const res = await evaluationsAPI.lister(params)
      dispatch({ type: 'SET_EVALUATION', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  const enregistrerNotes = useCallback(async (id, notes) => {
    try {
      const res = await evaluationsAPI.enregistrerNotes(id, notes)
      dispatch({ type: 'UPDATE_EVALUATION', payload: res })
      return res
    } catch (err) {
      throw err
    }
  }, [dispatch])

  return { loading, error, planifierEntretien, listerEvaluations, enregistrerNotes }
}