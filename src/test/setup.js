import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage avant tout import de modules
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index],
  }
})()

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', localStorageMock)
