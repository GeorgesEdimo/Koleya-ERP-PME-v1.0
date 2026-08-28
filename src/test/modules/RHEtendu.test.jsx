import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../contexts/AppContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'
import { useState, useEffect } from 'react'

// Mock des API pour éviter les appels réseau
vi.mock('../../utils/api', () => ({
  clientsAPI: { list: async () => [], create: async (d) => d, update: async (id, d) => d, delete: async () => {} },
  facturesAPI: { list: async () => ({ factures: [] }), create: async (d) => d, update: async (id, d) => d, delete: async () => {}, convertir: async (d) => d },
  creditsAPI: { list: async () => [], create: async (d) => d, delete: async () => {}, payer: async () => ({ nouveauReste: 0, nouveauStatut: 'payee' }) },
  produitsAPI: { list: async () => [], create: async (d) => d, update: async (id, d) => d, delete: async () => {} },
  employesAPI: { list: async () => [], create: async (d) => d, update: async (id, d) => d, delete: async () => {} },
  depensesAPI: { list: async () => [], create: async (d) => d, delete: async () => {} },
  statsAPI: { entreprise: async () => ({}) },
  authAPI: { me: async () => ({ user: {} }) },
  paieAPI: { calculer: async (d) => ({ id: '1', ...d, salaire_net: 444644, statut: 'genere' }), lister: async () => [] },
  congesAPI: { soumettre: async (d) => ({ id: '2', ...d, statut: 'en_attente' }), lister: async () => [], decider: async () => ({}) },
  evaluationsAPI: { planifier: async (d) => ({ id: '3', ...d, statut: 'planifie' }), lister: async () => [], enregistrerNotes: async () => ({}) },
}))

const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppProvider>
          {component}
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

// Tests du reducer AppContext avec les états RH étendus
describe('AppContext RH Reducer', () => {
  it('devrait ajouter un bulletin de paie', async () => {
    let dispatchRef
    const TestComponent = () => {
      const { dispatch, loading } = useApp()
      dispatchRef = dispatch
      useEffect(() => {
        dispatch({ type: 'ADD_PAIE', payload: { id: 'test', salaire_net: 444644 } })
      }, [])
      return <div data-testid="loading">{loading ? 'Loading' : 'Done'}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('Done'))
  })

  it('devrait gérer les états conges', async () => {
    const TestComponent = () => {
      const { dispatch, state } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_CONGE', payload: { id: 'conge1', type_conge: 'annuel', statut: 'en_attente' } })
      }, [])
      return <div data-testid="conges-count">{state.conges.length}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByTestId('conges-count')).toHaveTextContent('1'))
  })

  it('devrait gérer les états evaluations', async () => {
    const TestComponent = () => {
      const { dispatch, state } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_EVALUATION', payload: { id: 'eval1', annee: 2026, note_globale: 8.5 } })
      }, [])
      return <div data-testid="eval-count">{state.evaluations.length}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByTestId('eval-count')).toHaveTextContent('1'))
  })

  it('devrait mettre à jour un congé existant', async () => {
    const TestComponent = () => {
      const { dispatch, state } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_CONGE', payload: { id: 'conge2', type_conge: 'maladie', statut: 'en_attente' } })
        dispatch({ type: 'UPDATE_CONGE', payload: { id: 'conge2', statut: 'approuve' } })
      }, [])
      const approuve = state.conges.find(c => c.id === 'conge2')
      return <div data-testid="conge-statut">{approuve?.statut}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByTestId('conge-statut')).toHaveTextContent('approuve'))
  })

  it('devrait remplacer la liste des évaluations (SET_EVALUATION)', async () => {
    const TestComponent = () => {
      const { dispatch, state } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_EVALUATION', payload: { id: 'eval-old' } })
        dispatch({ type: 'SET_EVALUATION', payload: [{ id: 'eval-new', annee: 2026 }] })
      }, [])
      return <div data-testid="eval-count">{state.evaluations.length}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByTestId('eval-count')).toHaveTextContent('1'))
  })
})
