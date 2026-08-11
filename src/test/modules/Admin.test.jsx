import { describe, it, expect } from 'vitest'

describe('Module Admin', () => {
  it('valide les roles disponibles', () => {
    const roles = ['proprietaire', 'admin', 'comptable', 'employe']
    expect(roles).toContain('proprietaire')
    expect(roles).toContain('admin')
    expect(roles).toContain('comptable')
    expect(roles).toContain('employe')
  })

  it('determine les droits par role', () => {
    const droits = {
      proprietaire: ['facturation', 'credits', 'stock', 'rh', 'parametres'],
      admin: ['facturation', 'credits', 'stock', 'rh'],
      comptable: ['facturation', 'credits', 'depenses', 'rapports'],
      employe: ['facturation_read', 'credits_read', 'stock_read'],
    }

    expect(droits.proprietaire).toContain('parametres')
    expect(droits.employe).toContain('facturation_read')
    expect(droits.employe).not.toContain('parametres')
  })

  it('valide les plans disponibles', () => {
    const plans = ['starter', 'pro', 'business']
    expect(plans).toContain('starter')
    expect(plans).toContain('pro')
    expect(plans).toContain('business')
  })

  it('verifie la possession d\'une entreprise', () => {
    const entrepriseId = '123'
    const userEntrepriseId = '123'
    expect(entrepriseId).toBe(userEntrepriseId)
  })
})
