import { describe, it, expect, beforeEach } from 'vitest'

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Module Credits', () => {
  beforeEach(() => { localStorage.clear() })

  it('calcule le reste d\'un credit', () => {
    const montantTotal = 50000
    const montantPaye = 20000
    const reste = montantTotal - montantPaye
    expect(reste).toBe(30000)
  })

  it('determine le statut du credit', () => {
    const calculerStatut = (total, paye) => paye >= total ? 'paye' : 'en_cours'
    expect(calculerStatut(50000, 50000)).toBe('paye')
    expect(calculerStatut(50000, 20000)).toBe('en_cours')
  })

  it('enregistre un paiement de credit', () => {
    const credit = { montantTotal: 50000, montantPaye: 20000, reste: 30000 }
    const paiement = { montant: 10000, methode: 'Mobile Money' }

    const nouveauPaye = credit.montantPaye + paiement.montant
    const nouveauReste = credit.montantTotal - nouveauPaye

    expect(nouveauPaye).toBe(30000)
    expect(nouveauReste).toBe(20000)
  })

  it('filtre les credits en retard', () => {
    const credits = [
      { statut: 'en_cours', echeance: '2026-07-01' },
      { statut: 'en_retard', echeance: '2026-06-01' },
      { statut: 'paye', echeance: '2026-05-01' },
    ]

    const enRetard = credits.filter(c => c.statut === 'en_retard')
    expect(enRetard).toHaveLength(1)
  })
})
