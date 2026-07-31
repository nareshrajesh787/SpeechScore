import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyzerForm from '../components/AnalyzerForm';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

describe('AnalyzerForm', () => {
  it('renders correctly with default props', () => {
    const defaultProps = {
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
    };

    render(<AnalyzerForm {...defaultProps} />);
    
    expect(screen.getByText(/Audio File/i)).toBeInTheDocument();
    expect(screen.getByText(/Speech Prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluation Rubric/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Speech/i })).toBeInTheDocument();
  });
});
