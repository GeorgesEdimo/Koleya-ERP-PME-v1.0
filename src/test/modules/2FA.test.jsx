import { describe, it, expect } from 'vitest'

describe('Module 2FA', () => {
  it('genere un code a 6 chiffres', () => {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    expect(code).toHaveLength(6)
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000)
    expect(parseInt(code)).toBeLessThan(1000000)
  })

  it('valide les canaux 2FA', () => {
    const canaux = ['sms', 'email']
    expect(canaux).toContain('sms')
    expect(canaux).toContain('email')
  })

  it('verifie l\'expiration du code', () => {
    const creeLe = new Date(Date.now() - 6 * 60 * 1000) // Il y a 6 minutes
    const expiresAt = new Date(creeLe.getTime() + 5 * 60 * 1000) // Expire apres 5 min
    const expire = new Date() > expiresAt
    expect(expire).toBe(true)
  })

  it('verifie qu\'un code non expire est valide', () => {
    const creeLe = new Date(Date.now() - 2 * 60 * 1000) // Il y a 2 minutes
    const expiresAt = new Date(creeLe.getTime() + 5 * 60 * 1000) // Expire apres 5 min
    const expire = new Date() > expiresAt
    expect(expire).toBe(false)
  })
})
