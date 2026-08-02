import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Metric, { getMetricTone } from '../components/ui/Metric';

describe('getMetricTone: wpm', () => {
  // Ideal band is 130-150, matching the reference band in TrendCharts.
  it.each([
    [129.9, 'caution'],
    [130, 'good'],   // lower edge of the ideal band is inclusive
    [140, 'good'],
    [150, 'good'],   // upper edge of the ideal band is inclusive
    [150.1, 'caution'],
  ])('wpm %p is %s', (value, expected) => {
    expect(getMetricTone('wpm', value)).toBe(expected);
  });

  it.each([
    [114.9, 'needs-work'],
    [115, 'caution'],      // caution band starts here
    [170, 'caution'],      // ...and ends here, inclusive
    [170.1, 'needs-work'],
    [182, 'needs-work'],   // the "much too fast" case this component exists for
    [60, 'needs-work'],
  ])('wpm %p is %s', (value, expected) => {
    expect(getMetricTone('wpm', value)).toBe(expected);
  });
});

describe('getMetricTone: fillers', () => {
  it.each([
    [0, 'good'],
    [3, 'good'],        // boundary is inclusive
    [3.1, 'caution'],
    [8, 'caution'],     // boundary is inclusive
    [8.1, 'needs-work'],
    [29, 'needs-work'],
  ])('a raw total of %p is %s', (value, expected) => {
    expect(getMetricTone('fillers', value)).toBe(expected);
  });

  it('normalizes to fillers-per-minute when durationSeconds is supplied', () => {
    // 6 fillers over 2 minutes = 3/min -> good, even though the raw total of 6
    // would score as caution.
    expect(getMetricTone('fillers', 6)).toBe('caution');
    expect(getMetricTone('fillers', 6, { durationSeconds: 120 })).toBe('good');
  });

  it('gives the SAME raw value different tones at different durations', () => {
    // This is the whole point of the rate normalization.
    expect(getMetricTone('fillers', 10, { durationSeconds: 60 })).toBe('needs-work'); // 10/min
    expect(getMetricTone('fillers', 10, { durationSeconds: 600 })).toBe('good');      // 1/min
  });

  it('falls back to the raw total for a missing or nonsensical duration', () => {
    expect(getMetricTone('fillers', 10, { durationSeconds: 0 })).toBe('needs-work');
    expect(getMetricTone('fillers', 10, { durationSeconds: -60 })).toBe('needs-work');
    expect(getMetricTone('fillers', 10, { durationSeconds: NaN })).toBe('needs-work');
    expect(getMetricTone('fillers', 10)).toBe('needs-work');
  });
});

describe('getMetricTone: clarity', () => {
  it.each([
    [10, 'good'],
    [7.5, 'good'],       // boundary is inclusive
    [7.4, 'caution'],
    [5, 'caution'],      // boundary is inclusive
    [4.9, 'needs-work'],
    [0, 'needs-work'],
  ])('clarity %p is %s', (value, expected) => {
    expect(getMetricTone('clarity', value)).toBe(expected);
  });
});

describe('getMetricTone: rubric', () => {
  it.each([
    [40, 40, 'good'],     // 100%
    [30, 40, 'good'],     // exactly 75%, inclusive
    [29, 40, 'caution'],  // 72.5%
    [20, 40, 'caution'],  // exactly 50%, inclusive
    [19, 40, 'needs-work'], // 47.5%
    [0, 40, 'needs-work'],
  ])('%p out of %p is %s', (value, max, expected) => {
    expect(getMetricTone('rubric', value, { max })).toBe(expected);
  });

  it('is neutral rather than crashing when max is missing, zero, or invalid', () => {
    expect(getMetricTone('rubric', 29)).toBe('neutral');
    expect(getMetricTone('rubric', 29, {})).toBe('neutral');
    expect(getMetricTone('rubric', 29, { max: 0 })).toBe('neutral');
    expect(getMetricTone('rubric', 29, { max: null })).toBe('neutral');
    expect(getMetricTone('rubric', 29, { max: -10 })).toBe('neutral');
    expect(getMetricTone('rubric', 29, { max: NaN })).toBe('neutral');
  });
});

describe('getMetricTone: missing values and unknown types', () => {
  it.each([null, undefined, NaN, Infinity, -Infinity, 'many'])('%p is neutral', (value) => {
    expect(getMetricTone('wpm', value)).toBe('neutral');
    expect(getMetricTone('fillers', value)).toBe('neutral');
    expect(getMetricTone('clarity', value)).toBe('neutral');
    expect(getMetricTone('rubric', value, { max: 40 })).toBe('neutral');
  });

  it('an unknown type is neutral even with a perfectly valid value', () => {
    expect(getMetricTone('vocabulary', 7)).toBe('neutral');
    expect(getMetricTone(undefined, 7)).toBe('neutral');
  });
});

describe('Metric rendering', () => {
  it('renders the label and value', () => {
    render(<Metric label="WPM" value={168} type="wpm" />);
    expect(screen.getByText('WPM')).toBeInTheDocument();
    expect(screen.getByText('168')).toBeInTheDocument();
  });

  it('renders an em-dash and a neutral tone for a null value', () => {
    render(<Metric label="WPM" value={null} type="wpm" />);
    const value = screen.getByText('—');
    expect(value).toBeInTheDocument();
    expect(value.className).toContain('text-ink-700');
    expect(value.className).not.toContain('text-good-700');
    expect(value.className).not.toContain('text-needs-work-700');
  });

  it.each([undefined, NaN])('renders an em-dash for %p', (value) => {
    render(<Metric label="Clarity" value={value} type="clarity" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('colors a good value with the good tone and never a needs-work class', () => {
    const { container } = render(<Metric label="WPM" value={140} type="wpm" />);
    const value = screen.getByText('140');
    expect(value.className).toContain('text-good-700');
    expect(value.className).not.toContain('needs-work');
    expect(value.className).not.toContain('caution');
    // The tile background carries the tone too.
    expect(container.firstChild.className).toContain('bg-good-50');
    expect(container.firstChild.className).not.toContain('needs-work');
  });

  it('colors an out-of-band value with the needs-work tone', () => {
    const { container } = render(<Metric label="WPM" value={182} type="wpm" />);
    const value = screen.getByText('182');
    expect(value.className).toContain('text-needs-work-700');
    expect(value.className).not.toContain('text-good-700');
    expect(container.firstChild.className).toContain('bg-needs-work-50');
  });

  it('colors a middling value with the caution tone', () => {
    render(<Metric label="Clarity" value={6} type="clarity" />);
    expect(screen.getByText('6').className).toContain('text-caution-700');
  });

  it('renders rubric values as value/max', () => {
    render(<Metric label="Rubric" value={29} max={40} type="rubric" />);
    expect(screen.getByText('29/40')).toBeInTheDocument();
  });

  it('renders a rubric with no max as a neutral bare value', () => {
    render(<Metric label="Rubric" value={29} type="rubric" />);
    const value = screen.getByText('29');
    expect(value.className).toContain('text-ink-700');
  });

  it('applies the per-minute filler rate to the rendered tone', () => {
    const { unmount } = render(<Metric label="Fillers" value={10} type="fillers" durationSeconds={60} />);
    expect(screen.getByText('10').className).toContain('text-needs-work-700');
    unmount();

    render(<Metric label="Fillers" value={10} type="fillers" durationSeconds={600} />);
    expect(screen.getByText('10').className).toContain('text-good-700');
  });

  it('conveys the tone in words, not by color alone', () => {
    const { unmount } = render(<Metric label="WPM" value={140} type="wpm" />);
    expect(screen.getByText('on target')).toBeInTheDocument();
    unmount();

    const { unmount: unmount2 } = render(<Metric label="WPM" value={160} type="wpm" />);
    expect(screen.getByText('slightly fast')).toBeInTheDocument();
    unmount2();

    const { unmount: unmount3 } = render(<Metric label="WPM" value={100} type="wpm" />);
    expect(screen.getByText('much too slow')).toBeInTheDocument();
    unmount3();

    render(<Metric label="Clarity" value={3} type="clarity" />);
    expect(screen.getByText('needs work')).toBeInTheDocument();
  });

  it('exposes the tone in a title attribute as well', () => {
    const { container } = render(<Metric label="WPM" value={182} type="wpm" />);
    expect(container.firstChild).toHaveAttribute('title', expect.stringContaining('much too fast'));
  });

  it('uses the serif display face and tabular numerals so values do not jitter', () => {
    render(<Metric label="WPM" value={140} type="wpm" />);
    const value = screen.getByText('140');
    expect(value.className).toContain('font-display');
    expect(value.className).toContain('tabular-nums');
    expect(value.className).toContain('text-xl');
  });

  it('appends a custom className last', () => {
    const { container } = render(<Metric label="WPM" value={140} type="wpm" className="col-span-2" />);
    expect(container.firstChild.className).toContain('col-span-2');
    expect(container.firstChild.className.trim().endsWith('col-span-2')).toBe(true);
  });

  it('never reaches for the reserved gold accent', () => {
    const { container } = render(<Metric label="Rubric" value={40} max={40} type="rubric" />);
    expect(container.firstChild.className).not.toContain('accent');
    expect(screen.getByText('40/40').className).not.toContain('accent');
  });
});
