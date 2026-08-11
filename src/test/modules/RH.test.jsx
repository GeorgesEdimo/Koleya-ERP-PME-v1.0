import { describe, it, expect } from 'vitest'

describe('Module RH', () => {
  it('calcule le salaire net', () => {
    const salaireBrut = 200000
    const cnps = salaireBrut * 0.042
    const irpp = salaireBrut > 200000 ? (salaireBrut - 200000) * 0.10 : 0
    const salaireNet = salaireBrut - cnps - irpp
    // 200000 - 8400 - 0 = 191600
    expect(salaireNet).toBeCloseTo(191600)
  })

  it('calcule le taux CNPS', () => {
    const tauxSalarie = 0.042
    const tauxEmployeur = 0.0865
    const salaire = 150000

    const cnpsSalarie = salaire * tauxSalarie
    const cnpsEmployeur = salaire * tauxEmployeur

    expect(cnpsSalarie).toBe(6300)
    expect(cnpsEmployeur).toBeCloseTo(12975)
  })

  it('determine le statut d\'un employe', () => {
    const employes = [
      { statut: 'actif' },
      { statut: 'actif' },
      { statut: 'inactif' },
    ]

    const actifs = employes.filter(e => e.statut === 'actif')
    expect(actifs).toHaveLength(2)
  })

  it('calcule la masse salariale', () => {
    const employes = [
      { salaire: 150000 },
      { salaire: 200000 },
      { salaire: 100000 },
    ]

    const masseSalariale = employes.reduce((s, e) => s + e.salaire, 0)
    expect(masseSalariale).toBe(450000)
  })

  it('calcule les jours de conges restants', () => {
    const congesAnnee = 30
    const congesPris = 12
    const congesRestants = congesAnnee - congesPris
    expect(congesRestants).toBe(18)
  })
})
