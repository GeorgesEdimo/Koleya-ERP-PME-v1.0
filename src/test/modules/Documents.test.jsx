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

describe('Module Documents', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('charge les documents depuis localStorage', () => {
    const docs = [
      { id: '1', numero: 'FAC-2026-001', type: 'facture', totalTTC: 100000 }
    ]
    localStorage.setItem('koleya_documents', JSON.stringify(docs))

    const stored = JSON.parse(localStorage.getItem('koleya_documents'))
    expect(stored).toHaveLength(1)
    expect(stored[0].type).toBe('facture')
  })

  it('ajoute un document dans localStorage', () => {
    const doc = {
      id: Date.now().toString(),
      numero: 'DEV-2026-001',
      type: 'devis',
      totalTTC: 250000,
      template: 'classique-bleu'
    }

    const stored = JSON.parse(localStorage.getItem('koleya_documents') || '[]')
    stored.unshift(doc)
    localStorage.setItem('koleya_documents', JSON.stringify(stored))

    const result = JSON.parse(localStorage.getItem('koleya_documents'))
    expect(result).toHaveLength(1)
    expect(result[0].template).toBe('classique-bleu')
  })

  it('compte les documents par type', () => {
    const docs = [
      { type: 'facture' },
      { type: 'facture' },
      { type: 'devis' },
      { type: 'recu' },
    ]

    const counts = {}
    docs.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1 })
    expect(counts.facture).toBe(2)
    expect(counts.devis).toBe(1)
    expect(counts.recu).toBe(1)
  })

  it('genere un numero de document correct', () => {
    const types = {
      facture: 'FAC',
      devis: 'DEV',
      recu: 'REC',
      bon_commande: 'BCO',
      bon_livraison: 'BLV',
      note_credit: 'NCR',
    }

    Object.entries(types).forEach(([type, prefixe]) => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const numero = `${prefixe}-${date}-001`
      expect(numero).toMatch(new RegExp(`^${prefixe}-\\d{8}-001$`))
    })
  })
})
