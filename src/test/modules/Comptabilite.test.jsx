import { describe, it, expect } from 'vitest'

describe('Module Comptabilite', () => {
  it('calcule le benefice net', () => {
    const ca = 1000000
    const depenses = 300000
    const salaires = 400000
    const beneficeNet = ca - depenses - salaires
    expect(beneficeNet).toBe(300000)
  })

  it('calcule la marge brute', () => {
    const ca = 1000000
    const coutProduits = 400000
    const margeBrute = ((ca - coutProduits) / ca) * 100
    expect(margeBrute).toBeCloseTo(60)
  })

  it('classe les depenses par categorie', () => {
    const depenses = [
      { categorie: 'Loyer', montant: 250000 },
      { categorie: 'Electricite', montant: 45000 },
      { categorie: 'Loyer', montant: 50000 },
    ]

    const parCategorie = depenses.reduce((acc, d) => {
      acc[d.categorie] = (acc[d.categorie] || 0) + d.montant
      return acc
    }, {})

    expect(parCategorie.Loyer).toBe(300000)
    expect(parCategorie.Electricite).toBe(45000)
  })

  it('calcule le taux de recouvrement', () => {
    const ca = 1000000
    const encaisse = 750000
    const taux = (encaisse / ca) * 100
    expect(taux).toBe(75)
  })

  it('verifie l\'equilibre d\'une ecriture comptable', () => {
    const lignes = [
      { debit: 100000, credit: 0 },
      { debit: 0, credit: 100000 },
    ]

    const totalDebit = lignes.reduce((s, l) => s + l.debit, 0)
    const totalCredit = lignes.reduce((s, l) => s + l.credit, 0)

    expect(totalDebit).toBe(totalCredit)
  })
})
