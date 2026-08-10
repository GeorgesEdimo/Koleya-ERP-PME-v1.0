import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ToastProvider, useToast } from '../../components/UI/Toast'

function TestComponent() {
  const { toast } = useToast()
  return (
    <div data-testid="wrapper">
      <button data-testid="btn-success" onClick={() => toast.success('Operation reussie')}>Success</button>
      <button data-testid="btn-error" onClick={() => toast.error('Une erreur est survenue')}>Error</button>
      <button data-testid="btn-warning" onClick={() => toast.warning('Attention requise')}>Warning</button>
      <button data-testid="btn-info" onClick={() => toast.info('Information utile')}>Info</button>
    </div>
  )
}

describe('Toast', () => {
  it('affiche un toast de succes', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('btn-success'))
    expect(screen.getByText('Operation reussie')).toBeTruthy()
  })

  it('affiche un toast d\'erreur', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('btn-error'))
    expect(screen.getByText('Une erreur est survenue')).toBeTruthy()
  })

  it('affiche un toast d\'avertissement', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('btn-warning'))
    expect(screen.getByText('Attention requise')).toBeTruthy()
  })

  it('affiche un toast d\'info', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('btn-info'))
    expect(screen.getByText('Information utile')).toBeTruthy()
  })
})
