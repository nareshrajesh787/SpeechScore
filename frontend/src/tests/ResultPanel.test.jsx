import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

// ResultPanel transitively imports CoachChat, which imports ../firebase for
// auth.currentUser; firebase.js throws in a test environment without real
// VITE_FIREBASE_* env vars, so it needs a stub here.
vi.mock('../firebase', () => ({
  auth: {},
}));

import ResultPanel from '../components/ResultPanel';

const baseResult = {
  transcript: 'This is a test transcript.',
  wpm: 130,
  filler_count: { um: 2 },
  clarity_score: 8.5,
  pace_feedback: 'Your pace is just right. Keep it up!',
  ai_feedback: { strengths: ['Clear intro'], improvements: ['Slow down'] },
};

describe('ResultPanel filter removal', () => {
  // The "Filter Analysis" dropdown only keyword-matched the AI feedback
  // prose (not the actual metrics) and routinely produced confusing
  // "No strengths found for this filter" results, so it was removed
  // entirely. This guards against it coming back.
  it('does not render the Filter Analysis dropdown', () => {
    render(<ResultPanel result={{
      ...baseResult,
      rubric_scores: { Clarity: { score: 8, max_score: 10 } },
      rubric_total: 15,
      rubric_max: 20,
    }} />);

    expect(screen.queryByText(/Filter Analysis/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/All Feedback/i)).not.toBeInTheDocument();
  });
});

describe('ResultPanel rubric breakdown', () => {
  it('renders per-criterion scores for the current {score, max_score} shape', () => {
    render(<ResultPanel result={{
      ...baseResult,
      rubric_scores: { Clarity: { score: 8, max_score: 10 } },
      rubric_total: 15,
      rubric_max: 20,
    }} />);

    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('renders per-criterion scores for the legacy bare-number shape', () => {
    render(<ResultPanel result={{
      ...baseResult,
      rubric_scores: { Clarity: 4 },
      rubric_total: 15,
      rubric_max: 20,
    }} />);

    expect(screen.getByText('4/5')).toBeInTheDocument();
  });
});

describe('ResultPanel tabs', () => {
  const scoredResult = {
    ...baseResult,
    rubric_scores: { Clarity: { score: 8, max_score: 10 } },
    rubric_total: 15,
    rubric_max: 20,
  };

  it('renders both tabs and switches visible content when "Ask Coach" is clicked', () => {
    render(<ResultPanel result={scoredResult} />);

    const transcriptTab = screen.getByRole('button', { name: /Transcript/i });
    const coachTab = screen.getByRole('button', { name: /Ask Coach/i });
    expect(transcriptTab).toBeInTheDocument();
    expect(coachTab).toBeInTheDocument();

    // Transcript is the default tab.
    expect(screen.getByText(/Interactive Transcript/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Ask a question about your speech/i)).not.toBeInTheDocument();

    fireEvent.click(coachTab);

    expect(screen.getByPlaceholderText(/Ask a question about your speech/i)).toBeInTheDocument();
    expect(screen.queryByText(/Interactive Transcript/i)).not.toBeInTheDocument();

    // And back again, proving onChange is wired in both directions.
    fireEvent.click(transcriptTab);
    expect(screen.getByText(/Interactive Transcript/i)).toBeInTheDocument();
  });
});

describe('ResultPanel last analyzed timestamp', () => {
  it('shows a formatted date (not "Just now") when result.createdAt is a Firestore Timestamp', () => {
    const oldDate = new Date('2024-01-01');
    render(<ResultPanel result={{
      ...baseResult,
      rubric_scores: { Clarity: { score: 8, max_score: 10 } },
      rubric_total: 15,
      rubric_max: 20,
      createdAt: { toDate: () => oldDate },
    }} />);

    expect(screen.queryByText(/Just now/)).not.toBeInTheDocument();
    expect(screen.getByText(new RegExp(oldDate.toLocaleString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });

  it('falls back to "Just now" without crashing when neither createdAt nor timestamp is present', () => {
    render(<ResultPanel result={{
      ...baseResult,
      rubric_scores: { Clarity: { score: 8, max_score: 10 } },
      rubric_total: 15,
      rubric_max: 20,
    }} />);

    expect(screen.getByText(/Just now/)).toBeInTheDocument();
  });
});

describe('ResultPanel score hero', () => {
  const scoredResult = {
    ...baseResult,
    rubric_scores: { Clarity: { score: 8, max_score: 10 } },
    rubric_total: 29,
    rubric_max: 40,
  };

  it('renders the overall score as the dominant figure, with a grade label', () => {
    render(<ResultPanel result={scoredResult} />);

    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.getByText('/40')).toBeInTheDocument();
    // 29/40 = 72.5%, which is the "caution" band (50-75%) per Metric's
    // getMetricTone thresholds -- "room to improve", not "strong".
    expect(screen.getByText('Solid, with room to grow')).toBeInTheDocument();
  });

  it('renders an em-dash and a neutral label when there is no rubric score to show', () => {
    render(<ResultPanel result={{ ...baseResult, rubric_scores: {} }} />);

    expect(screen.getByText('Not yet scored')).toBeInTheDocument();
  });

  it('shows a score delta vs. the previous draft when both have a rubric total', () => {
    render(<ResultPanel
      result={scoredResult}
      previousRecording={{ rubric_total: 26, rubric_max: 40 }}
    />);

    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('shows no score delta without a previous draft', () => {
    const { container } = render(<ResultPanel result={scoredResult} />);
    expect(container.querySelector('[title*="vs last draft"]')).not.toBeInTheDocument();
  });

  it('shows fillers and clarity deltas vs. the previous draft, but never a WPM delta', () => {
    render(<ResultPanel
      result={{ ...scoredResult, wpm: 168, clarity_score: 7.4, filler_count: { um: 11 } }}
      previousRecording={{ rubric_total: 26, rubric_max: 40, wpm: 158, clarity_score: 7.0, filler_count: { um: 20 } }}
    />);

    // -9 fillers (11 - 20, fewer is better).
    expect(screen.getByText('-9')).toBeInTheDocument();
    // +0.4 clarity (7.4 - 7.0).
    expect(screen.getByText('+0.4')).toBeInTheDocument();
    // WPM went 158 -> 168 (+10 raw), but must never render as a delta chip --
    // see the matching comment in ResultPanel.jsx on why WPM is excluded.
    expect(screen.queryByText('+10')).not.toBeInTheDocument();
  });
});
