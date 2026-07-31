import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
  getCountFromServer: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [{ uid: 'test-uid', displayName: 'Test User' }, false, undefined],
}));

// AuthButton (rendered via Navbar) uses this directly, independent of useAuthState.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  },
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

import Dashboard from '../components/Dashboard';

describe('Dashboard', () => {
  // Regression test: containerVariants/itemVariants were previously declared
  // inside the `if (loading)` block but used outside it, so any render past
  // the loading state threw a ReferenceError. This exercises that path.
  it('renders the authenticated empty state without throwing', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test User/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });
});
