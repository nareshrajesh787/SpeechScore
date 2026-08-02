import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyzerForm from '../components/AnalyzerForm';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

function makeDefaultProps(overrides = {}) {
  return {
    audioFile: null,
    setAudioFile: vi.fn(),
    prompt: '',
    setPrompt: vi.fn(),
    rubric: '',
    projectId: null,
    selectedScenario: 'Custom',
    handleScenarioChange: vi.fn(),
    presetName: 'Custom',
    handleRubricChange: vi.fn(),
    isLoading: false,
    isUploadingAudio: false,
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

function makeDataTransfer(files) {
  return { files, dataTransfer: { files } };
}

describe('AnalyzerForm', () => {
  it('renders correctly with default props', () => {
    render(<AnalyzerForm {...makeDefaultProps()} />);

    expect(screen.getByText(/Audio File/i)).toBeInTheDocument();
    expect(screen.getByText(/Speech Prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluation Rubric/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Speech/i })).toBeInTheDocument();
  });

  // Regression coverage: the dropzone's copy ("Click or drag to upload")
  // promised drag-and-drop with no onDrop handler wired up at all.
  describe('drag-and-drop upload', () => {
    it('sets the audio file when a valid audio file is dropped', () => {
      const setAudioFile = vi.fn();
      render(<AnalyzerForm {...makeDefaultProps({ setAudioFile })} />);

      const dropzone = screen.getByTestId('audio-dropzone');
      const file = new File(['fake-audio-bytes'], 'speech.mp3', { type: 'audio/mpeg' });

      fireEvent.drop(dropzone, makeDataTransfer([file]));

      expect(setAudioFile).toHaveBeenCalledWith(file);
    });

    it('ignores a dropped file that is not audio', () => {
      const setAudioFile = vi.fn();
      render(<AnalyzerForm {...makeDefaultProps({ setAudioFile })} />);

      const dropzone = screen.getByTestId('audio-dropzone');
      const file = new File(['not audio'], 'notes.txt', { type: 'text/plain' });

      fireEvent.drop(dropzone, makeDataTransfer([file]));

      expect(setAudioFile).not.toHaveBeenCalled();
    });

    it('shows a visual drag-active state while a file is dragged over, and clears it on drop', () => {
      render(<AnalyzerForm {...makeDefaultProps()} />);

      const dropzone = screen.getByTestId('audio-dropzone');
      expect(dropzone.className).not.toContain('border-brand-500');

      fireEvent.dragOver(dropzone, makeDataTransfer([]));
      expect(dropzone.className).toContain('border-brand-500');

      fireEvent.dragLeave(dropzone, makeDataTransfer([]));
      expect(dropzone.className).not.toContain('border-brand-500');
    });
  });
});
