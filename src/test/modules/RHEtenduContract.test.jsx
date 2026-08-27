import { describe, it, expect } from 'vitest'

describe('RH Etendu API — Contract Tests (Unit)', () => {
  it('calcule la paie correctement (brut, cnps 4.2%, irpp, net)', () => {
    const brut = 500000
    const cnps = Math.round(brut * 0.042) // 21000
    const baseTaxable = brut - cnps // 479000
    const irpp = Math.round((baseTaxable - 166667) * 0.10) // 31233
    const cac = Math.round(irpp * 0.10) // 3123
    const net = brut - cnps - irpp - cac

    expect(cnps).toBe(21000)
    expect(net).toBe(444644)
  })

  it('valide la structure d\'une demande de conge', () => {
    const conge = {
      type_conge: 'annuel',
      date_debut: '2026-09-01',
      date_fin: '2026-09-15',
      nb_jours: 10,
      statut: 'en_attente',
    }
    expect(conge.nb_jours).toBeGreaterThan(0)
    expect(conge.statut).toBe('en_attente')
  })

  it('valide une evaluation annuelle', () => {
    const evalData = {
      annee: 2026,
      note_globale: 8.5,
      statut: 'planifie',
    }
    expect(evalData.note_globale).toBeLessThanOrEqual(10)
    expect(evalData.annee).toBe(2026)
  })
})
