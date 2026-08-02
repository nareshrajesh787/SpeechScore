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
  collection: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
  onSnapshot: vi.fn(() => unsubscribeSpy),
}));

import SpeechAnalyzerPage from '../components/SpeechAnalyzerPage';

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

  const promptField = screen.getByLabelText(/Speech prompt/i);
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
