import { describe, it, expect } from 'vitest';
import { getAiFeedback, getFillerTotal, getRubricScoreEntries } from '../utils/normalizeRecording';

describe('getAiFeedback', () => {
  it('reads from the current ai_feedback shape', () => {
    const result = getAiFeedback({
      ai_feedback: { strengths: ['Clear intro'], improvements: ['Slow down'] },
    });
    expect(result).toEqual({ strengths: ['Clear intro'], improvements: ['Slow down'] });
  });

  it('falls back to legacy top-level strengths/improvements', () => {
    const result = getAiFeedback({
      strengths: ['Clear intro'],
      improvements: ['Slow down'],
    });
    expect(result).toEqual({ strengths: ['Clear intro'], improvements: ['Slow down'] });
  });

  it('returns empty arrays when nothing is present', () => {
    expect(getAiFeedback({})).toEqual({ strengths: [], improvements: [] });
  });
});

describe('getFillerTotal', () => {
  it('sums a {word: count} breakdown', () => {
    expect(getFillerTotal({ um: 2, uh: 1 })).toBe(3);
  });

  it('passes through a legacy bare number', () => {
    expect(getFillerTotal(3)).toBe(3);
  });

  it('returns null when absent', () => {
    expect(getFillerTotal(undefined)).toBeNull();
  });
});

describe('getRubricScoreEntries', () => {
  it('reads the current {score, max_score} shape', () => {
    const entries = getRubricScoreEntries({ Clarity: { score: 8, max_score: 10 } });
    expect(entries).toEqual([{ criterion: 'Clarity', score: 8, max: 10 }]);
  });

  it('falls back to a bare legacy numeric score with a default max', () => {
    const entries = getRubricScoreEntries({ Clarity: 4 });
    expect(entries).toEqual([{ criterion: 'Clarity', score: 4, max: 5 }]);
  });

  it('returns an empty list when absent', () => {
    expect(getRubricScoreEntries(undefined)).toEqual([]);
  });
});
