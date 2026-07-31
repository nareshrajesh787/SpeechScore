import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
