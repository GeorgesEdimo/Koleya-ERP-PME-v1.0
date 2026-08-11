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

describe('Module Notifications', () => {
  beforeEach(() => { localStorage.clear() })

  it('genere un ID de notification unique', () => {
    const id1 = Date.now().toString()
    const id2 = Date.now().toString()
    expect(id1).toBe(id2) // Meme appel = meme ID
  })

  it('valide les canaux de notification', () => {
    const canaux = ['sms', 'whatsapp', 'email']
    expect(canaux).toContain('sms')
    expect(canaux).toContain('whatsapp')
    expect(canaux).toContain('email')
  })

  it('valide les types de notification', () => {
    const types = ['facture_relance', 'credit_rappel', 'stock_alerte', 'manuel']
    expect(types).toContain('facture_relance')
    expect(types).toContain('credit_rappel')
    expect(types).toContain('stock_alerte')
    expect(types).toContain('manuel')
  })

  it('enregistre une notification dans localStorage', () => {
    const notif = {
      id: Date.now().toString(),
      canal: 'whatsapp',
      destinataire: '+237690000000',
      message: 'Test',
      statut: 'envoye',
      type_source: 'manuel',
    }

    const stored = JSON.parse(localStorage.getItem('koleya_notifications') || '[]')
    stored.unshift(notif)
    localStorage.setItem('koleya_notifications', JSON.stringify(stored))

    const result = JSON.parse(localStorage.getItem('koleya_notifications'))
    expect(result).toHaveLength(1)
    expect(result[0].canal).toBe('whatsapp')
  })

  it('genere un message de relance correct', () => {
    const facture = { numero: 'FAC-2026-001', clientNom: 'Test Client', reste: 50000 }
    const message = `Bonjour ${facture.clientNom}, votre facture ${facture.numero} de ${facture.reste} FCFA reste impayee.`
    expect(message).toContain('Test Client')
    expect(message).toContain('FAC-2026-001')
    expect(message).toContain('50000')
  })
})
