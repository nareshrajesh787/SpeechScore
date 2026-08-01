import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordingCard from '../components/RecordingCard';

describe('RecordingCard shape normalization', () => {
  it('renders fillers/strengths for the current nested shape', () => {
    render(<RecordingCard recording={{
      wpm: 130,
      clarity_score: 8.5,
      filler_count: { um: 2, uh: 1 },
      ai_feedback: { strengths: ['Clear structure'], improvements: [] },
      rubric_total: 8,
      rubric_max: 10,
    }} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // total fillers, summed
    expect(screen.getByText('Clear structure')).toBeInTheDocument();
  });

  it('renders fillers/strengths for the legacy flat shape', () => {
    render(<RecordingCard recording={{
      wpm: 130,
      clarity_score: 8.5,
      filler_count: 3, // legacy bare total instead of a breakdown
      strengths: ['Clear structure'], // legacy top-level field
      rubric_total: 8,
      rubric_max: 10,
    }} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Clear structure')).toBeInTheDocument();
  });
});

describe('RecordingCard draft numbering', () => {
  it('falls back to "Analysis" when neither a name nor draft props are given', () => {
    render(<RecordingCard recording={{}} />);
    expect(screen.getByText('Analysis')).toBeInTheDocument();
  });

  it('shows "Draft N" via explicit isDraft/draftNumber props', () => {
    render(<RecordingCard recording={{}} isDraft draftNumber={3} />);
    expect(screen.getByText('Draft 3')).toBeInTheDocument();
  });

  it('prefers an explicit recording.name over draft numbering', () => {
    render(<RecordingCard recording={{ name: 'Final Pitch' }} isDraft draftNumber={3} />);
    expect(screen.getByText('Final Pitch')).toBeInTheDocument();
    expect(screen.queryByText('Draft 3')).not.toBeInTheDocument();
  });

  it('still honors isDraft/draftNumber set directly on the recording object', () => {
    render(<RecordingCard recording={{ isDraft: true, draftNumber: 1 }} />);
    expect(screen.getByText('Draft 1')).toBeInTheDocument();
  });
});

describe('RecordingCard delete button', () => {
  // Regression coverage for a mobile-usability bug: the delete button used to
  // be `opacity-0 group-hover:opacity-100`, making it permanently unreachable
  // on touch devices (no hover state). It must always be visible and meet the
  // ~44px minimum tap target.
  it('is visible without hovering, and calls onDelete without triggering onClick', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    const recording = { id: 'r1' };
    render(<RecordingCard recording={recording} onClick={onClick} onDelete={onDelete} />);

    const deleteButton = screen.getByTitle('Delete recording');
    expect(deleteButton.className).not.toContain('opacity-0');

    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(recording);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('meets the 44px minimum tap target via padding around a 16px icon', () => {
    render(<RecordingCard recording={{}} onDelete={vi.fn()} />);
    const deleteButton = screen.getByTitle('Delete recording');
    // p-3.5 (14px) padding on each side of a w-4/h-4 (16px) icon = 44px.
    expect(deleteButton.className).toContain('p-3.5');
  });

  it('does not render a delete button when onDelete is not provided', () => {
    render(<RecordingCard recording={{}} />);
    expect(screen.queryByTitle('Delete recording')).not.toBeInTheDocument();
  });
});
