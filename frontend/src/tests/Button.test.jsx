import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../components/ui/Button';

describe('Button variants', () => {
  it('defaults to the primary variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.className).toContain('bg-indigo-600');
  });

  it.each([
    ['primary', 'bg-indigo-600'],
    ['secondary', 'bg-white'],
    ['ghost', 'bg-transparent'],
    ['outline', 'border-2'],
    ['danger', 'bg-red-600'],
    ['warning', 'bg-amber-500'],
    ['inverted', 'bg-white'],
    ['subtle', 'text-gray-500'],
  ])('applies distinct styling for the %s variant', (variant, expectedClass) => {
    render(<Button variant={variant}>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain(expectedClass);
  });

  it('falls back to primary for an unknown variant', () => {
    render(<Button variant="not-a-real-variant">Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('bg-indigo-600');
  });

  it('the inverted variant uses indigo-900 text so it reads on dark sections', () => {
    render(<Button variant="inverted">Start a practice run</Button>);
    const button = screen.getByRole('button', { name: 'Start a practice run' });
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('text-indigo-900');
    // Should not need !important overrides to beat the primary variant.
    expect(button.className).not.toContain('!bg-white');
  });

  it('every variant gets visible focus-ring styling', () => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'warning', 'inverted', 'subtle'];
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Action</Button>);
      const button = screen.getByRole('button', { name: 'Action' });
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toMatch(/focus:ring-(indigo|gray|red|amber)-\d+|focus:ring-white/);
      unmount();
    });
  });

  it('renders as a different element via the `as` prop, keeping button styling', () => {
    render(<Button as="a" href="/analyze">Go analyze</Button>);
    const link = screen.getByRole('link', { name: 'Go analyze' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/analyze');
    expect(link.className).toContain('bg-indigo-600');
  });

  it('merges custom className and forwards onClick/props', () => {
    const handleClick = vi.fn();
    render(<Button className="w-full" onClick={handleClick} disabled>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('w-full');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled(); // disabled buttons don't fire click
  });
});
