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

describe('RecordingCard delta chips', () => {
  const current = { rubric_total: 29, rubric_max: 40, clarity_score: 7.4, filler_count: { um: 11 } };
  const previous = { rubric_total: 26, rubric_max: 40, clarity_score: 7.0, filler_count: { um: 20 } };

  it('renders no delta chips without a previousRecording', () => {
    // Query by DeltaBadge's own title format (ends with the `label` prop
    // verbatim, e.g. "...clarity") rather than by visible text: "Clarity"/
    // "Fillers" are ALSO the always-rendered Metric tile labels, so a plain
    // text query would false-match those regardless of whether any delta
    // chip exists.
    const { container } = render(<RecordingCard recording={current} />);
    expect(container.querySelector('[title$="score"]')).not.toBeInTheDocument();
    expect(container.querySelector('[title$="fillers"]')).not.toBeInTheDocument();
    expect(container.querySelector('[title$="clarity"]')).not.toBeInTheDocument();
  });

  it('renders score, fillers, and clarity deltas -- but never a WPM delta -- vs the previous draft', () => {
    render(<RecordingCard
      recording={{ ...current, wpm: 168 }}
      previousRecording={{ ...previous, wpm: 158 }}
    />);

    // +3 score (29 - 26), gold/improved.
    expect(screen.getByText('+3')).toBeInTheDocument();
    // -9 fillers (11 - 20), fewer is better, still gold.
    expect(screen.getByText('-9')).toBeInTheDocument();
    // +0.4 clarity (7.4 - 7.0).
    expect(screen.getByText('+0.4')).toBeInTheDocument();

    // WPM going 158 -> 168 is a +10 raw delta, but WPM never gets a chip:
    // "better" WPM means closer to the ideal band, not higher, so a signed
    // delta would misreport direction of improvement above the band.
    expect(screen.queryByText('+10')).not.toBeInTheDocument();
  });

  it('omits an individual delta chip when that specific metric is missing on either draft', () => {
    const { container } = render(<RecordingCard
      recording={{ rubric_total: 29, rubric_max: 40 }} // no clarity_score, no filler_count
      previousRecording={{ rubric_total: 26, rubric_max: 40 }}
    />);

    expect(screen.getByText('+3')).toBeInTheDocument(); // score delta still renders
    expect(container.querySelector('[title$="clarity"]')).not.toBeInTheDocument();
    expect(container.querySelector('[title$="fillers"]')).not.toBeInTheDocument();
  });
});
