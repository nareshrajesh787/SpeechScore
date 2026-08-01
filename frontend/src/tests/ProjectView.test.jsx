import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

// Mutable auth state so individual tests can drive the loading / signed-out
// branches without re-mocking the module.
const authState = vi.hoisted(() => ({
  current: [{ uid: 'test-uid', displayName: 'Test User' }, false, undefined],
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => authState.current,
}));

// AuthButton (rendered via SignInGate) uses this directly, independent of
// useAuthState.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  },
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mutable Firestore fixtures for the project doc + its recordings subcollection.
const firestoreState = vi.hoisted(() => ({
  project: { name: 'Wedding Toast', description: 'Practice run' },
  projectExists: true,
  recordings: [],
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(async () => ({
    id: 'project-1',
    exists: () => firestoreState.projectExists,
    data: () => firestoreState.project,
  })),
  getDocs: vi.fn(async () => ({
    docs: firestoreState.recordings.map((rec) => ({
      id: rec.id,
      data: () => rec,
    })),
  })),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

// Navbar and ResultPanel are owned by other in-flight migrations; stub them so
// this test exercises ProjectView's own markup only. TrendCharts is stubbed to
// keep recharts (which needs real layout) out of jsdom.
vi.mock('../components/Navbar', () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock('../components/ResultPanel', () => ({
  default: ({ result }) => <div data-testid="result-panel">{result?.name}</div>,
}));

vi.mock('../components/charts/TrendCharts', () => ({
  default: () => <div data-testid="trend-charts">Trends</div>,
}));

import ProjectView from '../components/ProjectView';

function makeRecording(id, overrides = {}) {
  return {
    id,
    name: `Draft ${id}`,
    wpm: 140,
    clarity_score: 8.5,
    filler_count: { um: 2 },
    createdAt: { toDate: () => new Date('2026-01-01T10:00:00Z') },
    ...overrides,
  };
}

function renderProjectView() {
  return render(
    <MemoryRouter initialEntries={['/project/project-1']}>
      <Routes>
        <Route path="/project/:projectId" element={<ProjectView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectView', () => {
  beforeEach(() => {
    authState.current = [{ uid: 'test-uid', displayName: 'Test User' }, false, undefined];
    firestoreState.project = { name: 'Wedding Toast', description: 'Practice run' };
    firestoreState.projectExists = true;
    firestoreState.recordings = [];
  });

  it('renders the shared empty state when the project has no recordings', async () => {
    renderProjectView();

    await waitFor(() => {
      expect(screen.getByText('No recordings yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first recording to get started.')).toBeInTheDocument();

    // The CTA is a Button rendered `as={Link}`, so it stays a real anchor.
    const cta = screen.getByRole('link', { name: /Create First Recording/i });
    expect(cta).toHaveAttribute('href', '/analyze?projectId=project-1');

    // No tabs when there is nothing to chart.
    expect(screen.queryByRole('button', { name: /Trends/i })).not.toBeInTheDocument();
  });

  it('renders the shared tabs and recording cards when recordings exist', async () => {
    firestoreState.recordings = [makeRecording('a'), makeRecording('b')];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Recordings/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Trends/i })).toBeInTheDocument();
    expect(screen.queryByText('No recordings yet')).not.toBeInTheDocument();
    expect(screen.getByText('Draft a')).toBeInTheDocument();
    expect(screen.getByText('Draft b')).toBeInTheDocument();
  });

  it('switches to the trends panel when the Trends tab is clicked', async () => {
    firestoreState.recordings = [makeRecording('a'), makeRecording('b')];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Trends/i })).toBeInTheDocument();
    });

    expect(screen.queryByTestId('trend-charts')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Trends/i }));

    expect(screen.getByTestId('trend-charts')).toBeInTheDocument();
    expect(screen.queryByText('Draft a')).not.toBeInTheDocument();
  });

  it('opens the recording detail modal with an accessible close button', async () => {
    firestoreState.recordings = [makeRecording('a')];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByText('Draft a')).toBeInTheDocument();
    });

    // Modal is closed until a card is clicked.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Draft a'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId('result-panel')).toBeInTheDocument();

    // Regression: this close button previously had no accessible name.
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows the shared spinner while auth is still resolving', () => {
    authState.current = [null, true, undefined];

    renderProjectView();

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  // Regression guard for a fixed bug: `loadingData` is initialized to `true`
  // and only ever cleared inside the fetch effect, which early-returns when
  // there is no user. The `!user` guard must be checked before `loadingData`
  // (not after it) or a signed-out visitor is pinned on the spinner forever
  // and never sees the sign-in gate.
  it('shows the sign-in gate (not a permanent spinner) when there is no user', async () => {
    authState.current = [null, false, undefined];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByText('Sign in Required')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('numbers undraft recordings by chronological attempt, oldest first', async () => {
    // getDocs already returns newest-first (orderBy createdAt desc is mocked
    // away, but the fixture order stands in for it): 'a' is the newer take,
    // 'b' the older one, so 'b' should be Draft 1 and 'a' should be Draft 2.
    firestoreState.recordings = [
      makeRecording('a', { name: undefined }),
      makeRecording('b', { name: undefined }),
    ];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByText('Draft 2')).toBeInTheDocument();
    });
    expect(screen.getByText('Draft 1')).toBeInTheDocument();
  });

  it('replaces the native confirm() with an accessible delete-confirmation modal', async () => {
    firestoreState.recordings = [makeRecording('a')];

    renderProjectView();

    await waitFor(() => {
      expect(screen.getByText('Draft a')).toBeInTheDocument();
    });

    expect(screen.queryByText('Delete Recording?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Delete recording'));

    expect(await screen.findByText('Delete Recording?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete Recording?')).not.toBeInTheDocument();
    });
    // Cancelling must not have deleted anything.
    expect(screen.getByText('Draft a')).toBeInTheDocument();
  });
});
