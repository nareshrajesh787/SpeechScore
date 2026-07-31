import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// The user object MUST be a stable reference across renders. Dashboard has a
// `useEffect(..., [user])` data-fetch, so returning a fresh object literal on
// every call makes that effect re-run on every render -> setState -> re-render
// -> forever, which OOMs the vitest worker rather than failing cleanly.
// The real react-firebase-hooks useAuthState returns a stable Firebase User.
const TEST_USER = { uid: 'test-uid', displayName: 'Test User' };
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [TEST_USER, false, undefined],
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
    expect(
      screen.getByText(/Create a project to organize your speech recordings/i)
    ).toBeInTheDocument();
    // Both empty-state CTAs survive the EmptyState migration. "Quick Analyze"
    // intentionally appears twice (page header + empty-state CTA), so assert
    // on the count rather than expecting a single match.
    expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Quick Analyze/i })).toHaveLength(2);
  });

  // The New Project modal is now the shared <Modal>, so it must expose a real
  // dialog. The getByLabelText assertions are the regression guard for the
  // label/input association fix: the three labels previously had no htmlFor and
  // the inputs no id, so these queries threw before the fix.
  it('opens the New Project modal as a dialog with labelled form fields', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test User/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /New Project/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'new-project-heading');

    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Scenario/i)).toBeInTheDocument();
  });
});
