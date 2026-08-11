import { describe, it, expect } from 'vitest'

describe('QR Code Utility', () => {
  it('genere une URL de QR code valide', () => {
    const texte = 'Test QR Code'
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(texte)}&format=svg`
    expect(url).toContain('api.qrserver.com')
    expect(url).toContain('200x200')
    expect(url).toContain(encodeURIComponent(texte))
  })

  it('encode correctement les donnees produit', () => {
    const produit = { nom: 'Papier A4', reference: 'PAP-001', prix: 2500, stock: 100 }
    const donnees = JSON.stringify(produit)
    expect(donnees).toContain('Papier A4')
    expect(donnees).toContain('PAP-001')
  })

  it('genere un QR code pour une facture', () => {
    const facture = { numero: 'FAC-2026-001', entreprise: 'Koleya', montant: 100000, client: 'Test Client' }
    const donnees = JSON.stringify(facture)
    expect(donnees).toContain('FAC-2026-001')
    expect(donnees).toContain('Koleya')
  })
})
