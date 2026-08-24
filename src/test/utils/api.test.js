import { describe, it, expect, beforeEach } from 'vitest'

describe('API Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setTokens stocke le refresh token', async () => {
    const { setTokens } = await import('../../utils/api')
    setTokens('access123', 'refresh456')
    expect(localStorage.getItem('koleya_refresh_token')).toBe('refresh456')
  })

  it('clearTokens supprime le refresh token', async () => {
    const { setTokens, clearTokens } = await import('../../utils/api')
    setTokens('access123', 'refresh456')
    clearTokens()
    expect(localStorage.getItem('koleya_refresh_token')).toBeNull()
  })

  it('les tokens sont null par defaut', async () => {
    const { clearTokens } = await import('../../utils/api')
    clearTokens()
    expect(localStorage.getItem('koleya_refresh_token')).toBeNull()
  })
})
