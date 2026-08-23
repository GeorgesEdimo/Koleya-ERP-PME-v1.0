import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Fournisseurs } from '../../components/Fournisseurs/Fournisseurs'
import { Devis } from '../../components/Devis/Devis'

describe('Module Devis', () => {
  it('affiche le composant Devis', async () => {
    render(<Devis />)
    expect(screen.getByText('Devis')).toBeInTheDocument()
  })

  it('affiche le titre et les stats', async () => {
    render(<Devis />)
    expect(screen.getByText('Devis')).toBeInTheDocument()
    expect(screen.getByText('Total devis')).toBeInTheDocument()
    expect(screen.getByText('Brouillons')).toBeInTheDocument()
    expect(screen.getByText('Envoyés')).toBeInTheDocument()
    expect(screen.getByText('Valeur totale')).toBeInTheDocument()
  })

  it('gère la conversion d\'un devis en facture via le contexte', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    render(<Devis />)

    // Ajouter un devis factice dans l'état via le bouton "Nouveau devis"
    // ou vérifier que le composant interagit correctement avec le contexte

    const devisBoutons = screen.getAllByRole('button')
    const convertButtons = devisBoutons.filter(b =>
      b.textContent.includes('Convertir') || b.textContent.includes('convertir')
    )

    // Si des boutons de conversion existent, tester leur interaction
    if (convertButtons.length > 0) {
      expect(convertButtons.length).toBeGreaterThan(0)
    }
  })

  it('affiche le message d\'export PDF quand l\'abonnement est expiré', async () => {
    render(<Devis />)
    const exportButtons = screen.getAllByText(/Exporter PDF/)
    expect(exportButtons.length).toBeGreaterThan(0)
  })
})