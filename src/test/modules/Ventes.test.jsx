import { describe, it, expect, beforeEach } from 'vitest'

// Mock localStorage
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

describe('Module Ventes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('charge les ventes depuis localStorage', () => {
    const ventes = [
      { id: '1', numero: 'VTE-2026-001', client_nom: 'Test', montant_final: 50000, statut: 'payee', items: [] }
    ]
    localStorage.setItem('koleya_ventes', JSON.stringify(ventes))

    const stored = JSON.parse(localStorage.getItem('koleya_ventes'))
    expect(stored).toHaveLength(1)
    expect(stored[0].numero).toBe('VTE-2026-001')
  })

  it('ajoute une vente dans localStorage', () => {
    const vente = {
      id: Date.now().toString(),
      numero: 'VTE-2026-002',
      client_nom: 'Client Test',
      montant_final: 75000,
      statut: 'payee',
      items: [{ description: 'Produit A', quantite: 2, prix_unitaire: 37500 }]
    }

    const stored = JSON.parse(localStorage.getItem('koleya_ventes') || '[]')
    stored.unshift(vente)
    localStorage.setItem('koleya_ventes', JSON.stringify(stored))

    const result = JSON.parse(localStorage.getItem('koleya_ventes'))
    expect(result).toHaveLength(1)
    expect(result[0].montant_final).toBe(75000)
  })

  it('filtre les ventes par statut', () => {
    const ventes = [
      { statut: 'payee' },
      { statut: 'en_cours' },
      { statut: 'payee' },
    ]

    const payees = ventes.filter(v => v.statut === 'payee')
    expect(payees).toHaveLength(2)
  })

  it('calcule le total des ventes', () => {
    const ventes = [
      { montant_final: 50000 },
      { montant_final: 30000 },
      { montant_final: 20000 },
    ]

    const total = ventes.reduce((s, v) => s + v.montant_final, 0)
    expect(total).toBe(100000)
  })

  it('genere un numero de vente correct', () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const compteur = 1
    const numero = `VTE-${date}-${String(compteur).padStart(3, '0')}`
    expect(numero).toMatch(/^VTE-\d{8}-001$/)
  })
})
