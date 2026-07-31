import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveTranscript from '../components/InteractiveTranscript';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

const wordTimestamps = [
  { text: 'Hello', start: 0, end: 500, confidence: 0.99 },
  { text: 'world', start: 500, end: 1000, confidence: 0.98 },
];

describe('InteractiveTranscript keyboard access', () => {
  beforeEach(() => {
    // jsdom doesn't implement HTMLMediaElement.play(); stub it so
    // handleWordClick's audioRef.current.play() doesn't throw.
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('marks transcript words as focusable, keyboard-operable elements', () => {
    render(
      <InteractiveTranscript
        transcript="Hello world"
        wordTimestamps={wordTimestamps}
        fillerCount={{}}
        audioUrl="blob:fake-audio-url"
        audioDuration={1}
      />
    );

    const word = screen.getByText('world');
    expect(word).toHaveAttribute('role', 'button');
    expect(word).toHaveAttribute('tabIndex', '0');
    expect(word).toHaveAccessibleName();
  });

  it('seeks the audio on Enter, same as a click', () => {
    render(
      <InteractiveTranscript
        transcript="Hello world"
        wordTimestamps={wordTimestamps}
        fillerCount={{}}
        audioUrl="blob:fake-audio-url"
        audioDuration={1}
      />
    );

    const word = screen.getByText('world');
    const audio = document.querySelector('audio');

    fireEvent.keyDown(word, { key: 'Enter' });

    expect(audio.currentTime).toBeCloseTo(0.5); // word.start (500ms) / 1000
    expect(audio.play).toHaveBeenCalled();
  });

  it('seeks the audio on Space, same as a click', () => {
    render(
      <InteractiveTranscript
        transcript="Hello world"
        wordTimestamps={wordTimestamps}
        fillerCount={{}}
        audioUrl="blob:fake-audio-url"
        audioDuration={1}
      />
    );

    const word = screen.getByText('Hello');
    const audio = document.querySelector('audio');

    fireEvent.keyDown(word, { key: ' ' });

    expect(audio.currentTime).toBeCloseTo(0); // word.start (0ms) / 1000
    expect(audio.play).toHaveBeenCalled();
  });

  it('ignores unrelated keys', () => {
    render(
      <InteractiveTranscript
        transcript="Hello world"
        wordTimestamps={wordTimestamps}
        fillerCount={{}}
        audioUrl="blob:fake-audio-url"
        audioDuration={1}
      />
    );

    const word = screen.getByText('world');
    const audio = document.querySelector('audio');

    fireEvent.keyDown(word, { key: 'Tab' });

    expect(audio.play).not.toHaveBeenCalled();
  });
});
