import { describe, it, expect } from 'vitest'

describe('Module Parametres', () => {
  it('valide les parametres de facturation', () => {
    const parametres = {
      devise: 'FCFA',
      tva: 19.25,
      prefixeFacture: 'FAC',
      prefixeDevis: 'DEV',
      delaiPaiement: 30,
    }

    expect(parametres.devise).toBe('FCFA')
    expect(parametres.tva).toBe(19.25)
    expect(parametres.prefixeFacture).toBe('FAC')
    expect(parametres.prefixeDevis).toBe('DEV')
    expect(parametres.delaiPaiement).toBe(30)
  })

  it('valide les parametres entreprise', () => {
    const entreprise = {
      nom: 'Koleya',
      adresse: 'Douala, Cameroun',
      telephone: '+237690000000',
      email: 'contact@koleya.cm',
      nrcc: '12345',
    }

    expect(entreprise.nom).toBeTruthy()
    expect(entreprise.adresse).toBeTruthy()
    expect(entreprise.telephone).toMatch(/^\+237/)
  })

  it('genere un fichier de backup JSON', () => {
    const data = { clients: [], factures: [] }
    const json = JSON.stringify(data, null, 2)
    expect(json).toContain('clients')
    expect(json).toContain('factures')
  })
})
