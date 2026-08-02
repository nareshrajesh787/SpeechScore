import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

// jsdom doesn't do layout, so ResponsiveContainer normally reports a 0x0
// box and refuses to render its children's SVG. Force a fixed size so the
// underlying LineChart/YAxis actually mount and we can inspect real ticks.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 300 }}>
        {React.cloneElement(children, { width: 800, height: 300 })}
      </div>
    ),
  };
});

import TrendCharts from '../components/charts/TrendCharts';

function makeRecording(daysAgo, overrides = {}) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    createdAt: { toDate: () => date },
    wpm: 140,
    filler_count: { um: 1 },
    clarity_score: 8.5,
    ...overrides,
  };
}

describe('TrendCharts clarity scale', () => {
  it('renders the 0-10 scale caption instead of the stale 0-100 one', () => {
    const recordings = [makeRecording(2, { clarity_score: 6 }), makeRecording(0, { clarity_score: 9 })];

    render(<TrendCharts recordings={recordings} />);

    expect(screen.getByText('Speech clarity score (0-10 scale)')).toBeInTheDocument();
    expect(screen.queryByText(/0-100 scale/)).not.toBeInTheDocument();
  });

  it('plots the clarity YAxis on a 0-10 domain, not 0-100', () => {
    const recordings = [makeRecording(2, { clarity_score: 6 }), makeRecording(0, { clarity_score: 9 })];

    const { container } = render(<TrendCharts recordings={recordings} />);

    // Find the clarity chart's SVG (third ResponsiveContainer/LineChart in
    // the component: WPM, Fillers, Clarity) and inspect its rendered Y axis
    // tick labels. With domain [0, 10], recharts' default tick generation
    // should never produce a tick above 10; with the old [0, 100] domain it
    // would produce ticks like 0/20/40/60/80/100.
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3);

    const claritySvg = svgs[svgs.length - 1];
    // Recharts renders Y-axis tick labels in a
    // `.recharts-yAxis-tick-labels` group that is a sibling of (not nested
    // inside) `.recharts-yAxis` — the tick *lines* live there, the tick
    // *text* lives in this separate group.
    const tickTexts = Array.from(claritySvg.querySelectorAll('.recharts-yAxis-tick-labels tspan'))
      .map((el) => el.textContent);

    expect(tickTexts.length).toBeGreaterThan(0);
    const tickValues = tickTexts.map(Number);
    expect(tickValues.every((v) => v <= 10)).toBe(true);
    // Sanity: this would fail against the old domain={[0, 100]}, which
    // produces ticks well above 10 (e.g. 100).
    expect(tickValues.some((v) => v > 10)).toBe(false);
  });

  it('shows the empty state and skips chart rendering with fewer than 2 recordings', () => {
    render(<TrendCharts recordings={[makeRecording(0)]} />);

    expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
    expect(screen.queryByText(/Speech clarity score/)).not.toBeInTheDocument();
  });
});

describe('TrendCharts WPM domain', () => {
  it('tightens the WPM YAxis instead of zero-flooring it on a 0-200 auto range', () => {
    // dataMin=142, dataMax=182. Per the padding formula:
    //   lower = max(0, floor(142/10)*10 - 10) = max(0, 130) = 130
    //   upper = ceil(182/10)*10 + 10 = 190 + 10 = 200
    // Recharts' own "nice tick" rounding can still round the *lower* bound
    // outward to the next round step (observed: 130 -> 120 with a step of
    // 20), so we don't assert the tick lands on exactly 130. What matters is
    // that it's nowhere near the old zero-floored auto range, which for this
    // data would have produced ticks like 0/50/100/150/200.
    const recordings = [
      makeRecording(2, { wpm: 142 }),
      makeRecording(0, { wpm: 182 }),
    ];

    const { container } = render(<TrendCharts recordings={recordings} />);

    // WPM is the first chart (WPM, Fillers, Clarity).
    const wpmSvg = container.querySelectorAll('svg')[0];
    const tickTexts = Array.from(wpmSvg.querySelectorAll('.recharts-yAxis-tick-labels tspan'))
      .map((el) => el.textContent);

    expect(tickTexts.length).toBeGreaterThan(0);
    const tickValues = tickTexts.map(Number);

    expect(tickValues.some((v) => v === 0)).toBe(false);
    expect(tickValues.every((v) => v >= 100)).toBe(true);
  });
});

describe('TrendCharts x-axis', () => {
  it('labels the x-axis with draft numbers instead of raw calendar dates', () => {
    const recordings = [makeRecording(2), makeRecording(0)];

    render(<TrendCharts recordings={recordings} />);

    // The same "Draft N" tick renders once per chart (WPM, Fillers, Clarity).
    expect(screen.getAllByText('Draft 1').length).toBe(3);
    expect(screen.getAllByText('Draft 2').length).toBe(3);
  });
});

describe('TrendCharts filler bar coloring', () => {
  it('colors bars by absolute filler-rate thresholds, not a single flat color', async () => {
    const recordings = [
      // 1 filler / 120s = 0.5/min -> good
      makeRecording(2, { filler_count: { um: 1 }, audio_duration: 120 }),
      // 20 fillers / 60s = 20/min -> needs-work
      makeRecording(0, { filler_count: { um: 20 }, audio_duration: 60 }),
    ];

    const { container } = render(<TrendCharts recordings={recordings} />);

    // Bar shapes render via a react-smooth animation that doesn't paint
    // synchronously in jsdom, so wait for the <path> elements to appear.
    let bars;
    await waitFor(() => {
      const fillerSvg = container.querySelectorAll('svg')[1];
      bars = fillerSvg.querySelectorAll('.recharts-bar-rectangle path');
      expect(bars.length).toBe(2);
    }, { timeout: 8000 });

    const fills = Array.from(bars).map((bar) => bar.getAttribute('fill'));
    expect(fills[0]).toBe('#5C8A6A'); // good-500
    expect(fills[1]).toBe('#C26550'); // needs-work-500
    expect(fills[0]).not.toBe(fills[1]);
  });
});
