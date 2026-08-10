import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const wrapper = ({ children }) => React.createElement(AuthProvider, null, children)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('n\'est pas authentifie par defaut', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('connecte avec les bons identifiants', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@koleya.com', 'admin123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeTruthy()
    expect(result.current.user.email).toBe('admin@koleya.com')
  })

  it('rejette avec de mauvais identifiants', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    try {
      await act(async () => {
        await result.current.login('mauvais@email.com', 'mauvais')
      })
    } catch (e) {
      expect(e.message).toBe('Email ou mot de passe incorrect')
    }
  })

  it('deconnecte correctement', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@koleya.com', 'admin123')
    })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('inscrit un nouvel utilisateur', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup({
        nom: 'Test User',
        email: 'test@test.com',
        telephone: '+237600000001',
        password: 'test12345',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user.nom).toBe('Test User')
  })
})
