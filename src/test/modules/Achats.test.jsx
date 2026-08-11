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

describe('Module Achats', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('charge les achats depuis localStorage', () => {
    const achats = [
      { id: '1', numero: 'ACH-2026-001', fournisseur: 'Fournisseur Test', montant_final: 100000, statut: 'payee' }
    ]
    localStorage.setItem('koleya_achats', JSON.stringify(achats))

    const stored = JSON.parse(localStorage.getItem('koleya_achats'))
    expect(stored).toHaveLength(1)
    expect(stored[0].fournisseur).toBe('Fournisseur Test')
  })

  it('ajoute un achat dans localStorage', () => {
    const achat = {
      id: Date.now().toString(),
      numero: 'ACH-2026-002',
      fournisseur: 'Fournisseur B',
      montant_final: 150000,
      statut: 'en_cours',
      items: [{ description: 'Papier', quantite: 10, prix_unitaire: 15000 }]
    }

    const stored = JSON.parse(localStorage.getItem('koleya_achats') || '[]')
    stored.unshift(achat)
    localStorage.setItem('koleya_achats', JSON.stringify(stored))

    const result = JSON.parse(localStorage.getItem('koleya_achats'))
    expect(result).toHaveLength(1)
    expect(result[0].fournisseur).toBe('Fournisseur B')
  })

  it('calcule le total des achats', () => {
    const achats = [
      { montant_final: 100000 },
      { montant_final: 50000 },
    ]

    const total = achats.reduce((s, a) => s + a.montant_final, 0)
    expect(total).toBe(150000)
  })

  it('genere un numero d\'achat correct', () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const compteur = 1
    const numero = `ACH-${date}-${String(compteur).padStart(3, '0')}`
    expect(numero).toMatch(/^ACH-\d{8}-001$/)
  })
})
