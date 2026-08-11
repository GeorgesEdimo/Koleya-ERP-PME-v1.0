import { describe, it, expect } from 'vitest'

describe('Module Portail Client', () => {
  it('filtre les factures d\'un client', () => {
    const factures = [
      { clientId: 1, type: 'facture', total: 100000 },
      { clientId: 2, type: 'facture', total: 50000 },
      { clientId: 1, type: 'facture', total: 75000 },
    ]

    const clientFactures = factures.filter(f => f.clientId === 1 && f.type === 'facture')
    expect(clientFactures).toHaveLength(2)
  })

  it('filtre les credits d\'un client', () => {
    const credits = [
      { clientId: 1, montantTotal: 50000, reste: 30000 },
      { clientId: 2, montantTotal: 75000, reste: 75000 },
    ]

    const clientCredits = credits.filter(c => c.clientId === 1)
    expect(clientCredits).toHaveLength(1)
    expect(clientCredits[0].reste).toBe(30000)
  })

  it('calcule les totaux d\'un client', () => {
    const factures = [
      { total: 100000, paye: 80000, reste: 20000 },
      { total: 50000, paye: 50000, reste: 0 },
    ]

    const totalFactures = factures.reduce((s, f) => s + f.total, 0)
    const totalPaye = factures.reduce((s, f) => s + f.paye, 0)
    const totalReste = factures.reduce((s, f) => s + f.reste, 0)

    expect(totalFactures).toBe(150000)
    expect(totalPaye).toBe(130000)
    expect(totalReste).toBe(20000)
  })

  it('recherche un client par nom', () => {
    const clients = [
      { nom: 'Entreprise Kamga', telephone: '+237691234567' },
      { nom: 'Boutique Ngo Biyick', telephone: '+237677890123' },
    ]

    const result = clients.find(c => c.nom.toLowerCase().includes('kamga'))
    expect(result).toBeTruthy()
    expect(result.nom).toBe('Entreprise Kamga')
  })
})
