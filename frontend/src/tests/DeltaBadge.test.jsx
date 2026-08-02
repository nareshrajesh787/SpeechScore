import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeltaBadge from '../components/ui/DeltaBadge';

// Deliberately NOT mocking @fortawesome/react-fontawesome: DeltaBadge renders
// plain text arrow glyphs (arrow-up/arrow-down are not in the icon registry),
// so the direction assertions below test the real rendered output.

const badge = () => screen.getByTitle(/improved|declined|no change/);

describe('DeltaBadge', () => {
  describe('missing baseline', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['NaN', NaN],
    ])('renders nothing when previous is %s', (_name, previous) => {
      const { container } = render(<DeltaBadge current={18} previous={previous} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('improvement where higher is better', () => {
    it('reads +3 with an up arrow in gold', () => {
      render(<DeltaBadge current={29} previous={26} />);
      const el = badge();
      expect(el).toHaveTextContent('+3');
      expect(el).toHaveTextContent('↑');
      expect(el.className).toContain('bg-accent-50');
      expect(el.className).toContain('text-accent-700');
      expect(el.className).not.toContain('needs-work');
    });
  });

  describe('improvement where lower is better (fillers 20 -> 11)', () => {
    // The case most likely to be built backwards: the value DROPPED, so the
    // arrow must point DOWN, but dropping fillers is progress, so it is GOLD.
    it('is gold', () => {
      render(<DeltaBadge current={11} previous={20} lowerIsBetter />);
      const el = badge();
      expect(el.className).toContain('bg-accent-50');
      expect(el.className).toContain('text-accent-700');
      expect(el.className).not.toContain('needs-work');
    });

    it('reads -9 with a DOWN arrow, not an up arrow', () => {
      render(<DeltaBadge current={11} previous={20} lowerIsBetter />);
      const el = badge();
      expect(el).toHaveTextContent('-9');
      expect(el).toHaveTextContent('↓');
      expect(el).not.toHaveTextContent('↑');
    });

    it('describes the drop as an improvement for screen readers', () => {
      render(<DeltaBadge current={11} previous={20} lowerIsBetter />);
      expect(screen.getByText('improved by 9')).toBeInTheDocument();
      expect(badge()).toHaveAttribute('title', 'improved by 9');
    });

    it('the same drop WITHOUT lowerIsBetter is a clay regression', () => {
      render(<DeltaBadge current={11} previous={20} />);
      const el = badge();
      expect(el.className).toContain('needs-work');
      expect(el.className).not.toContain('accent');
      expect(el).toHaveTextContent('-9');
    });
  });

  describe('regression', () => {
    it('is clay and never gold', () => {
      render(<DeltaBadge current={22} previous={26} />);
      const el = badge();
      expect(el).toHaveTextContent('-4');
      expect(el).toHaveTextContent('↓');
      expect(el.className).toContain('bg-needs-work-50');
      expect(el.className).toContain('text-needs-work-700');
      expect(el.className).not.toContain('accent');
    });

    it('a rise on a lowerIsBetter metric is also clay', () => {
      render(<DeltaBadge current={29} previous={20} lowerIsBetter />);
      const el = badge();
      expect(el).toHaveTextContent('+9');
      expect(el).toHaveTextContent('↑');
      expect(el.className).toContain('needs-work');
      expect(el.className).not.toContain('accent');
      expect(screen.getByText('declined by 9')).toBeInTheDocument();
    });
  });

  describe('zero delta', () => {
    it('is neutral, carrying neither gold nor clay', () => {
      render(<DeltaBadge current={26} previous={26} />);
      const el = badge();
      expect(el.className).not.toContain('accent');
      expect(el.className).not.toContain('needs-work');
      expect(el.className).toContain('bg-paper-200');
    });

    it('shows no sign and no arrow', () => {
      render(<DeltaBadge current={26} previous={26} />);
      const el = badge();
      expect(el).toHaveTextContent('no change');
      expect(el.textContent).not.toContain('+');
      expect(el.textContent).not.toContain('↑');
      expect(el.textContent).not.toContain('↓');
    });

    it('stays neutral on a lowerIsBetter metric too', () => {
      render(<DeltaBadge current={11} previous={11} lowerIsBetter />);
      expect(badge().className).not.toContain('accent');
      expect(badge().className).not.toContain('needs-work');
    });
  });

  describe('precision', () => {
    it('renders +0.4 for 7.0 -> 7.4 at precision 1', () => {
      render(<DeltaBadge current={7.4} previous={7.0} precision={1} />);
      const el = badge();
      expect(el).toHaveTextContent('+0.4');
      expect(el.className).toContain('accent');
      expect(screen.getByText('improved by 0.4')).toBeInTheDocument();
    });

    it('defaults to 0 decimals, rounding a sub-unit change to neutral', () => {
      render(<DeltaBadge current={7.4} previous={7.4001} />);
      const el = badge();
      expect(el).toHaveTextContent('no change');
      expect(el.textContent).not.toContain('-0');
    });
  });

  describe('accessibility and composition', () => {
    it('exposes a non-color description of the meaning', () => {
      render(<DeltaBadge current={29} previous={26} />);
      expect(screen.getByText('improved by 3')).toBeInTheDocument();
      expect(badge()).toHaveAttribute('title', 'improved by 3');
    });

    it('hides the decorative arrow from assistive tech', () => {
      render(<DeltaBadge current={29} previous={26} />);
      const arrow = badge().querySelector('span[aria-hidden="true"]');
      expect(arrow).toHaveTextContent('↑');
    });

    it('appends the label to both visible and accessible text', () => {
      render(<DeltaBadge current={29} previous={26} label="from Draft 3" />);
      const el = badge();
      expect(el).toHaveTextContent('from Draft 3');
      expect(el).toHaveAttribute('title', 'improved by 3 from Draft 3');
    });

    it('uses font-display and tabular-nums on the numeric portion', () => {
      render(<DeltaBadge current={29} previous={26} />);
      const numeral = screen.getByText('+3');
      expect(numeral.className).toContain('font-display');
      expect(numeral.className).toContain('tabular-nums');
    });

    it('is a small inline-flex pill and appends className last', () => {
      render(<DeltaBadge current={29} previous={26} className="ml-2" />);
      const el = badge();
      expect(el.className).toContain('inline-flex');
      expect(el.className).toContain('rounded-full');
      expect(el.className).toContain('text-xs');
      expect(el.className.trim().endsWith('ml-2')).toBe(true);
    });
  });
});
