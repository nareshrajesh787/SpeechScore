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
  it('renders the three numbered steps and the submit button', () => {
    render(<AnalyzerForm {...makeDefaultProps()} />);

    expect(screen.getByRole('heading', { name: /Your recording/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /What are you practicing\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /How should we score it\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze speech/i })).toBeInTheDocument();
  });

  // Regression guard: the step titles are <h2>s, not <label>s. Every field
  // still needs a real label association -- the prompt textarea briefly lost
  // its label when the form was restructured into steps.
  it('keeps every field programmatically labelled', () => {
    render(<AnalyzerForm {...makeDefaultProps()} />);

    expect(screen.getByLabelText(/Speech prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Evaluation rubric/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Scenario/i)).toBeInTheDocument();
  });

  it('disables submit until a recording is attached, and explains why', () => {
    render(<AnalyzerForm {...makeDefaultProps()} />);

    expect(screen.getByRole('button', { name: /Analyze speech/i })).toBeDisabled();
    expect(screen.getByText(/Add a recording in step 1/i)).toBeInTheDocument();
  });

  describe('selected-file state', () => {
    const file = new File(['x'.repeat(2048)], 'pitch.mp3', { type: 'audio/mpeg' });

    it('replaces the dropzone with a confirmation card once a file is chosen', () => {
      render(<AnalyzerForm {...makeDefaultProps({ audioFile: file })} />);

      // The dropzone is gone; the file is confirmed by name and size.
      expect(screen.queryByTestId('audio-dropzone')).not.toBeInTheDocument();
      expect(screen.getByText('pitch.mp3')).toBeInTheDocument();
      expect(screen.getByText(/Ready to analyze/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analyze speech/i })).toBeEnabled();
    });

    it('clears the selection via the remove control', () => {
      const setAudioFile = vi.fn();
      render(<AnalyzerForm {...makeDefaultProps({ audioFile: file, setAudioFile })} />);

      fireEvent.click(screen.getByTitle('Remove file'));
      expect(setAudioFile).toHaveBeenCalledWith(null);
    });
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
