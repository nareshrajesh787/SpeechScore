import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sparkline from '../components/ui/Sparkline';

describe('Sparkline', () => {
    it('renders nothing with fewer than 2 valid values', () => {
        const { container } = render(<Sparkline values={[42]} />);
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders nothing when all values are non-finite', () => {
        const { container } = render(<Sparkline values={[null, undefined, NaN]} />);
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders an svg with a line, a fill area, and an end dot for valid data', () => {
        const { container } = render(<Sparkline values={[18, 22, 26, 29]} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(container.querySelectorAll('path')).toHaveLength(2); // area fill + line
        expect(container.querySelectorAll('circle')).toHaveLength(1); // last-point dot
    });

    it('does not divide by zero on a flat series (all equal values)', () => {
        const { container } = render(<Sparkline values={[10, 10, 10]} />);
        const linePath = container.querySelectorAll('path')[1].getAttribute('d');
        expect(linePath).not.toMatch(/NaN/);
    });

    // Regression guard: tone classes must be literal strings Tailwind's JIT
    // scanner can see in source, never `stroke-${tone}-500`-style
    // interpolation, or the CSS silently doesn't exist at build time.
    it('defaults to the brand tone', () => {
        const { container } = render(<Sparkline values={[1, 2, 3]} />);
        const line = container.querySelectorAll('path')[1];
        expect(line.getAttribute('class')).toContain('stroke-brand-500');
    });

    it('uses the accent (gold) tone only when explicitly passed', () => {
        const { container } = render(<Sparkline values={[1, 2, 3]} tone="accent" />);
        const line = container.querySelectorAll('path')[1];
        expect(line.getAttribute('class')).toContain('stroke-accent-500');
        expect(line.getAttribute('class')).not.toContain('stroke-brand-500');
    });

    it('falls back to the brand tone for an unrecognized tone value', () => {
        const { container } = render(<Sparkline values={[1, 2, 3]} tone="bogus" />);
        const line = container.querySelectorAll('path')[1];
        expect(line.getAttribute('class')).toContain('stroke-brand-500');
    });
});
