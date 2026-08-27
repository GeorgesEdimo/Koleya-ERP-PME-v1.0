import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../../contexts/AppContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { usePaie, useConges, useEvaluations } from '../../contexts/RhTools'
import { useApp } from '../../contexts/AppContext'
import { useState, useEffect } from 'react'

// Mock the api calls
vi.mock('../../utils/api', () => ({
  paieAPI: {
    calculer: async (data) => ({ id: '1', ...data, salaire_net: 444644, statut: 'genere' }),
    lister: async () => [],
    consulterSolde: async () => ({ total: 444644 }),
  },
  congesAPI: {
    soumettre: async (data) => ({ id: '2', ...data, statut: 'en_attente' }),
    lister: async () => [],
    decider: async (id, decision) => ({ id, ...decision, approuve_par: 'user1' }),
  },
  evaluationsAPI: {
    planifier: async (data) => ({ id: '3', ...data, statut: 'planifie' }),
    lister: async () => [],
    enregistrerNotes: async (id, notes) => ({ id, notes }),
  },
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

describe('RH Étendu UI (usePaie, useConges, useEvaluations)', () => {
  it('affiche les statistiques de paie correctement', async () => {
    const TestComponent = () => {
      const { stats } = usePaie()
      return <div>{stats ? `Net: ${stats.net}` : 'Loading'}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByText(/Net:/)).toBeInTheDocument())
  })

  it('soumet une demande de conge', async () => {
    const TestComponent = () => {
      const { soumettreDemande } = useConges()
      return (
        <button onClick={() => soumettreDemande({ type_conge: 'annuel', nb_jours: 5 })}>
          Soumettre
        </button>
      )
    }
    renderWithProviders(<TestComponent />)
    const button = screen.getByRole('button', { name: /soumettre/i })
    // Simuler le click - since API is mocked, it should complete without error
    fireEvent.click(button)
    await waitFor(() => expect(screen.getByText(/soumis/i)).toBeInTheDocument())
  })

  it('liste les evaluations', async () => {
    const TestComponent = () => {
      const { listerEvaluations } = useEvaluations()
      const [evaluations, setEvaluations] = useState([])
      useEffect(() => {
        listerEvaluations().then(setEvaluations)
      }, [])
      return (
        <ul>
          {evaluations.map((e) => (
            <li key={e.id}>{e.annee} - {e.note_globale}</li>
          ))}
        </ul>
      )
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByText(/2026 - 8.5/)).toBeInTheDocument())
  })
})

// Test the actual context providers and hooks
describe('AppContext with extended RH states', () => {
  it('should handle paie state', async () => {
    const TestComponent = () => {
      const { dispatch, loading } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_PAIE', payload: { id: 'test', salaire_net: 1000 } })
      }, [])
      return <div>{loading ? 'Loading' : 'Done'}</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument())
  })

  it('should handle conges state', async () => {
    const TestComponent = () => {
      const { dispatch } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_CONGE', payload: { id: 'conge1', type_conge: 'maladie' } })
      }, [])
      return <div>{state.conges.length} conges</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByText('1 conges')).toBeInTheDocument())
  })

  it('should handle evaluations state', async () => {
    const TestComponent = () => {
      const { dispatch } = useApp()
      useEffect(() => {
        dispatch({ type: 'ADD_EVALUATION', payload: { id: 'eval1', annee: 2026, note_globale: 9.0 } })
      }, [])
      return <div>{state.evaluations.length} evaluations</div>
    }
    renderWithProviders(<TestComponent />)
    await waitFor(() => expect(screen.getByText('1 evaluations')).toBeInTheDocument())
  })
})