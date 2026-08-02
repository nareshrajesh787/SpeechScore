import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../components/ui/Button';

describe('Button variants', () => {
  it('defaults to the primary variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.className).toContain('bg-brand-600');
  });

  it.each([
    ['primary', 'bg-brand-600'],
    ['secondary', 'bg-white'],
    ['ghost', 'bg-transparent'],
    ['outline', 'border-2'],
    ['danger', 'bg-needs-work-600'],
    ['warning', 'bg-caution-500'],
    ['inverted', 'bg-white'],
    ['subtle', 'text-ink-500'],
  ])('applies distinct styling for the %s variant', (variant, expectedClass) => {
    render(<Button variant={variant}>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain(expectedClass);
  });

  it('falls back to primary for an unknown variant', () => {
    render(<Button variant="not-a-real-variant">Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('bg-brand-600');
  });

  it('the inverted variant uses brand-900 text so it reads on dark sections', () => {
    render(<Button variant="inverted">Start a practice run</Button>);
    const button = screen.getByRole('button', { name: 'Start a practice run' });
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('text-brand-900');
    // Should not need !important overrides to beat the primary variant.
    expect(button.className).not.toContain('!bg-white');
  });

  it('every variant gets visible focus-ring styling', () => {
    const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'warning', 'inverted', 'subtle'];
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>Action</Button>);
      const button = screen.getByRole('button', { name: 'Action' });
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toMatch(/focus:ring-(brand|paper|needs-work|caution)-\d+|focus:ring-white/);
      unmount();
    });
  });

  it('renders as a different element via the `as` prop, keeping button styling', () => {
    render(<Button as="a" href="/analyze">Go analyze</Button>);
    const link = screen.getByRole('link', { name: 'Go analyze' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/analyze');
    expect(link.className).toContain('bg-brand-600');
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

  it('defaults to the md size (px-4 py-2 rounded-xl)', () => {
    render(<Button>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('px-4 py-2');
    expect(button.className).toContain('rounded-xl');
  });

  it('the icon size swaps in tight padding and a smaller radius, dropping the md padding', () => {
    render(<Button size="icon">X</Button>);
    const button = screen.getByRole('button', { name: 'X' });
    expect(button.className).toContain('p-2');
    expect(button.className).toContain('rounded-lg');
    expect(button.className).not.toContain('px-4 py-2');
    expect(button.className).not.toContain('rounded-xl');
  });

  it('disabled buttons get a universal dimmed, non-interactive treatment', () => {
    render(<Button disabled>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('disabled:opacity-50');
    expect(button.className).toContain('disabled:pointer-events-none');
  });

  it('the ghost variant additionally mutes to gray with no hover when disabled', () => {
    render(<Button variant="ghost" disabled>Action</Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.className).toContain('disabled:text-ink-400');
    expect(button.className).toContain('disabled:hover:bg-transparent');
  });
});
