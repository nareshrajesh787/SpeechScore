import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudioMode from '../components/StudioMode';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

// Scope note: these tests cover the initial (not-recording) state only. That
// state renders no <canvas> and touches neither MediaRecorder nor AudioContext,
// so the only unimplemented jsdom API in play is navigator.mediaDevices, which
// the error-path test stubs directly. Simulating a full record -> stop ->
// playback cycle would require hand-rolling MediaRecorder + AudioContext +
// canvas 2d context and is deliberately out of scope.
describe('StudioMode initial state', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete navigator.mediaDevices;
  });

  it('renders the Start Recording control as a real <button>', () => {
    render(<StudioMode onRecordingComplete={vi.fn()} />);

    const start = screen.getByRole('button', { name: /start recording/i });
    expect(start.tagName).toBe('BUTTON');
  });

  it('styles Start Recording with the shared Button primary variant', () => {
    render(<StudioMode onRecordingComplete={vi.fn()} />);

    const start = screen.getByRole('button', { name: /start recording/i });

    // primary variant
    expect(start).toHaveClass('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
    // Button base styles
    expect(start).toHaveClass('rounded-xl', 'font-semibold', 'transition-all');
    // per-instance sizing preserved through className
    expect(start).toHaveClass('px-8', 'py-4', 'text-lg', 'shadow-md');
  });

  it('renders inside a Card container that keeps the indigo-100 border', () => {
    const { container } = render(<StudioMode onRecordingComplete={vi.fn()} />);

    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-8', 'border-indigo-100');
  });

  it('shows only Start Recording before recording begins', () => {
    render(<StudioMode onRecordingComplete={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /pause/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
  });

  it('surfaces a permission error when the microphone is unavailable', async () => {
    // jsdom has no navigator.mediaDevices at all.
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
      writable: true
    });

    render(<StudioMode onRecordingComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /start recording/i }));

    expect(await screen.findByText(/failed to access microphone/i)).toBeInTheDocument();
  });
});
