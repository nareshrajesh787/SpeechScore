import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      getIdToken: vi.fn().mockResolvedValue('fake-token'),
    },
  },
  db: {},
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [{ uid: 'test-uid' }, false, undefined],
}));

// AuthButton (rendered via Navbar) uses this directly, independent of useAuthState.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback({ uid: 'test-uid' });
    return () => {};
  },
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../utils/audioStorage', () => ({
  uploadAudioToStorage: vi.fn().mockResolvedValue('https://fake-storage-url/audio.webm'),
}));

vi.mock('../config', () => ({
  API_URL: 'http://localhost:8000',
}));

// The onSnapshot mock deliberately never invokes its callback, simulating a
// background task that never reports completion, so we can test the timeout.
const unsubscribeSpy = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
  onSnapshot: vi.fn(() => unsubscribeSpy),
}));

// Stubbed so these tests exercise SpeechAnalyzerPage's own data-fetching, not
// ResultPanel's rendering (covered separately in ResultPanel.test.jsx). Exposes
// the previousRecording prop directly so the fetch-and-pass-through behavior
// is actually observable.
vi.mock('../components/ResultPanel', () => ({
  default: ({ previousRecording }) => (
    <div data-testid="result-panel">
      <span data-testid="result-panel-previous">
        {previousRecording ? `${previousRecording.rubric_total}/${previousRecording.rubric_max}` : 'none'}
      </span>
    </div>
  ),
}));

import SpeechAnalyzerPage from '../components/SpeechAnalyzerPage';
import { getDocs, onSnapshot } from 'firebase/firestore';

function renderPage() {
  return render(
    <MemoryRouter>
      <SpeechAnalyzerPage />
    </MemoryRouter>
  );
}

async function submitWithFile() {
  const fileInput = document.getElementById('audio-upload');
  const file = new File(['fake-audio-bytes'], 'speech.mp3', { type: 'audio/mpeg' });
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });

  const promptField = screen.getByLabelText(/What are you practicing\?/i);
  await act(async () => {
    fireEvent.change(promptField, { target: { value: 'Tell me about a challenge.' } });
  });

  const submitButton = screen.getByRole('button', { name: /Analyze speech/i });
  await act(async () => {
    fireEvent.click(submitButton);
  });
}

describe('SpeechAnalyzerPage analysis progress + timeout', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    unsubscribeSpy.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an analyzing banner with an incrementing elapsed-time counter', async () => {
    renderPage();
    await submitWithFile();

    await waitFor(() => {
      expect(screen.getByText(/Analyzing your speech/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/0s elapsed/)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/5s elapsed/)).toBeInTheDocument();
  });

  it('stops waiting and surfaces a timeout error if analysis never completes', async () => {
    renderPage();
    await submitWithFile();

    await waitFor(() => {
      expect(screen.getByText(/Analyzing your speech/i)).toBeInTheDocument();
    });

    // Advance past the 4-minute timeout.
    await act(async () => {
      vi.advanceTimersByTime(4 * 60 * 1000 + 1000);
    });

    expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Analyzing your speech/i)).not.toBeInTheDocument();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

// Regression coverage for a new feature: on submit within a project,
// SpeechAnalyzerPage looks up the most recent existing draft BEFORE writing
// the new recording doc (so "most recent" genuinely means the previous one,
// not the one being created), and passes it through to ResultPanel so the
// score hero can show a delta immediately after analysis completes.
describe('SpeechAnalyzerPage previous-draft fetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    getDocs.mockReset();
    onSnapshot.mockReset();
  });

  function renderWithProject() {
    return render(
      <MemoryRouter initialEntries={['/analyze?projectId=proj-1']}>
        <SpeechAnalyzerPage />
      </MemoryRouter>
    );
  }

  it('fetches the previous draft and passes it to ResultPanel once analysis completes', async () => {
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ rubric_total: 26, rubric_max: 40 }) }],
    });
    onSnapshot.mockImplementationOnce((docRef, onNext) => {
      onNext({ exists: () => true, data: () => ({ status: 'completed', rubric_total: 29, rubric_max: 40 }) });
      return unsubscribeSpy;
    });

    renderWithProject();
    await submitWithFile();

    await waitFor(() => {
      expect(screen.getByTestId('result-panel-previous')).toHaveTextContent('26/40');
    });
  });

  it('passes no previous draft for a Quick Analysis with no project (and never queries for one)', async () => {
    onSnapshot.mockImplementationOnce((docRef, onNext) => {
      onNext({ exists: () => true, data: () => ({ status: 'completed', rubric_total: 29, rubric_max: 40 }) });
      return unsubscribeSpy;
    });

    renderPage(); // no ?projectId in the URL
    await submitWithFile();

    await waitFor(() => {
      expect(screen.getByTestId('result-panel-previous')).toHaveTextContent('none');
    });
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('passes no previous draft for a brand-new project with no prior recordings', async () => {
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    onSnapshot.mockImplementationOnce((docRef, onNext) => {
      onNext({ exists: () => true, data: () => ({ status: 'completed', rubric_total: 18, rubric_max: 40 }) });
      return unsubscribeSpy;
    });

    renderWithProject();
    await submitWithFile();

    await waitFor(() => {
      expect(screen.getByTestId('result-panel-previous')).toHaveTextContent('none');
    });
  });
});
