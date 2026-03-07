import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Landing from './Landing';
import { AuthContext } from '../context/authContext';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

describe('Landing Page', () => {
  it('renders the main headline', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, profile: null, session: null, loading: false, login: async () => {}, signOut: async () => {} }}>
          <Landing />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Unveil Your True Desires/i })).toBeInTheDocument();
  });
});
