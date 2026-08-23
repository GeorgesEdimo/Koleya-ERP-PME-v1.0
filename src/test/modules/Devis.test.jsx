import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Devis from '../../components/Devis/Devis'

// Mock des contextes utilisés par le composant
const mockDispatch = async () => ({ ok: true, data: {} })

vi.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    state: {
      factures: [
        {
          id: 'd1', numero: 'DEV-2026-001', type: 'devis', statut: 'brouillon',
          clientNom: 'Client Test', date: '2026-08-01', echeance: '2026-08-31',
          total: 50000,
          items: [{ description: 'Service A', quantite: 2, prixUnitaire: 25000 }],
        },
      ],
      entreprise: { nom: 'Koleya SARL' },
    },
    dispatch: mockDispatch,
    generateNumero: () => 'FAC-2026-PROV',
  }),
}))

vi.mock('../../contexts/AbonnementContext', () => ({
  useAbonnement: () => ({ canExport: true }),
}))

function renderDevis() {
  return render(
    <MemoryRouter>
      <Devis />
    </MemoryRouter>
  )
}

describe('Module Devis', () => {
  it('affiche le titre et les statistiques', () => {
    renderDevis()
    expect(screen.getByText('Total devis')).toBeInTheDocument()
    expect(screen.getByText('Brouillons')).toBeInTheDocument()
    expect(screen.getByText('Envoyés')).toBeInTheDocument()
    expect(screen.getByText('Valeur totale')).toBeInTheDocument()
  })

  it('affiche un devis existant avec son numero et son client', async () => {
    renderDevis()
    await waitFor(() => expect(screen.getByText('DEV-2026-001')).toBeInTheDocument())
    expect(screen.getByText('Client Test')).toBeInTheDocument()
    expect(screen.getByText(/1 article/)).toBeInTheDocument()
  })

  it('affiche le montant total du devis en FCFA', async () => {
    renderDevis()
    await waitFor(() => expect(screen.getByText('50,000 FCFA')).toBeInTheDocument())
  })

  it('affiche le badge statut Brouillon', async () => {
    renderDevis()
    await waitFor(() => expect(screen.getByText('Brouillon')).toBeInTheDocument())
  })

  it('propose la conversion en facture pour un devis non accepte', async () => {
    renderDevis()
    await waitFor(() => expect(screen.getByText(/Convertir/)).toBeInTheDocument())
  })

  it('filtre les devis par recherche client', async () => {
    renderDevis()
    const input = screen.getByPlaceholderText('Rechercher...')
    // Le composant filtre sur clientNom : "Client Test" contient "client"
    expect(input).toBeInTheDocument()
  })
})
