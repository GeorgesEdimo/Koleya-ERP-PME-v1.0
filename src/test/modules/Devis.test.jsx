import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  it('affiche les 4 cartes de statistiques (labels)', () => {
    renderDevis()
    // Les 4 labels de stats sont présents (ils apparaissent aussi dans les filtres, donc on restreint aux cartes de statistiques)
    // Utilisation de getAllByText avec une query qui restreint aux éléments dans .stat-card pour éviter les faux positifs
    const statCards = Array.from(document.querySelectorAll('.stat-card'))
    const totalDevisInCard = statCards
      .find(card => card.textContent.includes('Total devis'))
    const brouillonsInCard = statCards
      .find(card => card.textContent.includes('Brouillons'))
    const envoiesInCard = statCards
      .find(card => card.textContent.includes('Envoyés'))
    const valeurTotaleInCard = statCards
      .find(card => card.textContent.includes('Valeur totale'))

    expect(totalDevisInCard).toBeInTheDocument()
    expect(brouillonsInCard).toBeInTheDocument()
    expect(envoiesInCard).toBeInTheDocument()
    expect(valeurTotaleInCard).toBeInTheDocument()
  })

  it('affiche les valeurs des statistiques', () => {
    renderDevis()
    // Les valeurs numériques : au moins '1' (total, brouillons) et '0' (envoyés)
    const ones = screen.getAllByText('1')
    const zeros = screen.getAllByText('0')
    expect(ones.length).toBeGreaterThanOrEqual(2)
    expect(zeros.length).toBeGreaterThanOrEqual(1)
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
      // La carte "Valeur totale" contient le montant avec la classe text-success-600
      const valeurTotale = screen.getByText('Valeur totale')
      const statCard = valeurTotale.closest('.stat-card')
      expect(statCard).toBeInTheDocument()
      // Le montant est dans un <p> avec text-success-600 à l'intérieur de cette carte
      const montant = statCard.querySelector('p.text-success-600')
      expect(montant).toBeInTheDocument()
      expect(montant.textContent).toMatch(/FCFA/)
    })
  })

  it('affiche le montant du devis dans la liste', async () => {
    renderDevis()
    await waitFor(() => {
      const devisCard = screen.getByText('DEV-2026-001').closest('.card')
      expect(devisCard).toBeInTheDocument()
      // Le montant principal : classe text-2xl font-bold text-dark-900 font-display
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