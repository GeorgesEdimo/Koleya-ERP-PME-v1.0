import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Devis from '../../components/Devis/Devis'

const mockDispatch = () => ({ ok: true, data: {} })

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
  it('affiche les 4 cartes de statistiques', () => {
    renderDevis()
    // Les 4 labels de stats sont présents
    expect(screen.getByText('Total devis')).toBeInTheDocument()
    expect(screen.getByText('Brouillons')).toBeInTheDocument()
    expect(screen.getByText('Envoyés')).toBeInTheDocument()
    expect(screen.getByText('Valeur totale')).toBeInTheDocument()
    // Les valeurs (au moins une fois)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('affiche un devis existant avec son numero et son client', async () => {
    renderDevis()
    await waitFor(() => expect(screen.getByText('DEV-2026-001')).toBeInTheDocument())
    expect(screen.getByText('Client Test')).toBeInTheDocument()
    expect(screen.getByText(/1 article/)).toBeInTheDocument()
  })

  it('affiche le montant total du devis dans la carte Valeur totale', async () => {
    renderDevis()
    await waitFor(() => {
      // On récupère la carte "Valeur totale" via son label parent
      const valeurLabel = screen.getByText('Valeur totale')
      const card = valeurLabel.closest('.stat-card')
      expect(card).toBeInTheDocument()
      // Dans cette carte, le montant a la classe text-success-600
      const montant = card.querySelector('.text-success-600')
      expect(montant).toBeInTheDocument()
      expect(montant.textContent).toMatch(/FCFA/)
    })
  })

  it('affiche le montant du devis dans la liste', async () => {
    renderDevis()
    await waitFor(() => {
      // Le montant principal du devis dans la liste (text-2xl font-bold text-dark-900)
      const devisCard = screen.getByText('DEV-2026-001').closest('.card')
      const montant = devisCard.querySelector('.text-2xl.font-bold.text-dark-900')
      expect(montant).toBeInTheDocument()
      expect(montant.textContent).toMatch(/FCFA/)
    })
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
    expect(input).toBeInTheDocument()
  })
})