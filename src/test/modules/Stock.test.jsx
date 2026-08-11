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

describe('Module Stock', () => {
  beforeEach(() => { localStorage.clear() })

  it('detecte les alertes de stock', () => {
    const produits = [
      { stock: 5, stockMin: 10 },
      { stock: 20, stockMin: 10 },
      { stock: 8, stockMin: 10 },
    ]

    const alertes = produits.filter(p => p.stock <= p.stockMin)
    expect(alertes).toHaveLength(2)
  })

  it('calcule la valeur du stock', () => {
    const produits = [
      { stock: 100, prixAchat: 1500 },
      { stock: 50, prixAchat: 3000 },
    ]

    const valeur = produits.reduce((s, p) => s + (p.stock * p.prixAchat), 0)
    expect(valeur).toBe(300000)
  })

  it('ajuste le stock positivement', () => {
    const stock = 100
    const ajustement = 50
    const nouveauStock = stock + ajustement
    expect(nouveauStock).toBe(150)
  })

  it('ajuste le stock negativement', () => {
    const stock = 100
    const ajustement = -30
    const nouveauStock = Math.max(0, stock + ajustement)
    expect(nouveauStock).toBe(70)
  })

  it('empeche le stock negatif', () => {
    const stock = 10
    const ajustement = -50
    const nouveauStock = Math.max(0, stock + ajustement)
    expect(nouveauStock).toBe(0)
  })

  it('calcule la marge beneficiaire', () => {
    const prixAchat = 1500
    const prixVente = 2500
    const marge = ((prixVente - prixAchat) / prixVente) * 100
    expect(marge).toBeCloseTo(40)
  })
})
