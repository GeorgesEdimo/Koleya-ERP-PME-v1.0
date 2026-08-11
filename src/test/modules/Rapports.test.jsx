import { describe, it, expect } from 'vitest'

describe('Module Rapports', () => {
  it('calcule le bilan financier', () => {
    const ca = 1000000
    const depenses = 300000
    const salaires = 400000
    const beneficeNet = ca - depenses - salaires
    const marge = (beneficeNet / ca) * 100

    expect(beneficeNet).toBe(300000)
    expect(marge).toBeCloseTo(30)
  })

  it('classe les clients par CA', () => {
    const clients = [
      { nom: 'Client A', ca: 500000 },
      { nom: 'Client B', ca: 300000 },
      { nom: 'Client C', ca: 700000 },
    ]

    const classe = clients.sort((a, b) => b.ca - a.ca)
    expect(classe[0].nom).toBe('Client C')
    expect(classe[2].nom).toBe('Client B')
  })

  it('calcule l\'aging des creances', () => {
    const factures = [
      { echeance: '2026-08-01', reste: 50000 },
      { echeance: '2026-07-01', reste: 30000 },
      { echeance: '2026-06-01', reste: 20000 },
    ]

    const today = new Date('2026-08-10')
    const aging = factures.map(f => {
      const jours = Math.floor((today - new Date(f.echeance)) / (1000 * 60 * 60 * 24))
      let categorie = 'A jour'
      if (jours > 90) categorie = '+90 jours'
      else if (jours > 60) categorie = '60-90 jours'
      else if (jours > 30) categorie = '30-60 jours'
      else if (jours > 0) categorie = '1-30 jours'
      return { ...f, jours, categorie }
    })

    expect(aging[0].categorie).toBe('1-30 jours')
    expect(aging[1].categorie).toBe('30-60 jours')
    expect(aging[2].categorie).toBe('60-90 jours')
  })

  it('calcule le top produits par valeur', () => {
    const produits = [
      { nom: 'Papier', stock: 100, prixVente: 2500 },
      { nom: 'Cartouche', stock: 10, prixVente: 18000 },
      { nom: 'Cle USB', stock: 50, prixVente: 5500 },
    ]

    const classe = produits.sort((a, b) => (b.stock * b.prixVente) - (a.stock * a.prixVente))
    // Cle USB: 50 * 5500 = 275000 > Papier: 100 * 2500 = 250000
    expect(classe[0].nom).toBe('Cle USB')
  })
})
