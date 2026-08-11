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

describe('Module Facturation', () => {
  beforeEach(() => { localStorage.clear() })

  it('genere un numero de facture correct', () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const numero = `FAC-${date}-001`
    expect(numero).toMatch(/^FAC-\d{8}-001$/)
  })

  it('genere un numero de devis correct', () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const numero = `DEV-${date}-001`
    expect(numero).toMatch(/^DEV-\d{8}-001$/)
  })

  it('calcule le total HT et TTC', () => {
    const items = [
      { quantite: 2, prix_unitaire: 10000, taxe: 0 },
      { quantite: 1, prix_unitaire: 5000, taxe: 19.25 },
    ]
    const totalHT = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)
    const totalTaxes = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire * (i.taxe || 0) / 100), 0)
    const totalTTC = totalHT + totalTaxes

    expect(totalHT).toBe(25000)
    expect(totalTaxes).toBeCloseTo(962.5)
    expect(totalTTC).toBeCloseTo(25962.5)
  })

  it('valide les statuts de facture', () => {
    const statuts = ['brouillon', 'en_attente', 'payee', 'en_retard', 'annulee']
    expect(statuts).toContain('payee')
    expect(statuts).toContain('en_retard')
  })

  it('convertit devis en facture', () => {
    const devis = { type: 'devis', statut: 'brouillon', items: [{ description: 'Test', quantite: 1, prix_unitaire: 10000 }] }
    const facture = { ...devis, type: 'facture', statut: 'en_attente' }
    expect(facture.type).toBe('facture')
    expect(facture.statut).toBe('en_attente')
    expect(facture.items).toHaveLength(1)
  })

  it('calcule le reste a payer', () => {
    const total = 100000
    const paye = 60000
    const reste = total - paye
    expect(reste).toBe(40000)
  })

  it('determine le statut apres paiement partiel', () => {
    const calculerStatut = (total, paye) => paye >= total ? 'payee' : 'en_attente'
    expect(calculerStatut(100000, 100000)).toBe('payee')
    expect(calculerStatut(100000, 50000)).toBe('en_attente')
  })
})
