import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('rend sans erreur', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    expect(document.body).toBeTruthy()
  })
})
