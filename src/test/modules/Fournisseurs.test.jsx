import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Fournisseurs } from './Fournisseurs';

// Mock l'API
vi.mock('../../utils/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({
      data: {
        fournisseurs: [
          { id: 1, code: 'FOUR-0001', nom: 'Fournisseur Test', email: 'test@example.com', actif: true, type: 'local' }
        ],
        pages: 1
      }
    })),
    post: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
    put: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
    delete: vi.fn(() => Promise.resolve({ data: { message: 'OK' } }))
  }
}));

describe('Composant Fournisseurs', () => {
  it('affiche le titre', async () => {
    render(<Fournisseurs />);
    expect(screen.getByText('Fournisseurs')).toBeInTheDocument();
  });

  it('affiche la liste des fournisseurs', async () => {
    render(<Fournisseurs />);
    await waitFor(() => {
      expect(screen.getByText('FOUR-0001')).toBeInTheDocument();
    });
  });

  it('ouvre le modal de création', async () => {
    render(<Fournisseurs />);
    const button = screen.getByText('+ Nouveau Fournisseur');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Ajouter Fournisseur')).toBeInTheDocument();
    });
  });
});
