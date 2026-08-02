import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../components/ui/Card';

describe('Card variants', () => {
  it('defaults to the solid-white variant', () => {
    render(<Card>content</Card>);
    const card = screen.getByText('content');
    expect(card.className).toContain('bg-white');
  });

  // The `surface` variant exists for content that sits on the app's own warm
  // paper page canvas (SpeechAnalyzerPage's form, ResultPanel), where a flat
  // bg-white previously fought the canvas instead of settling onto it.
  it('the surface variant blends into a gradient background instead of a flat white', () => {
    render(<Card variant="surface">content</Card>);
    const card = screen.getByText('content');
    expect(card.className).toContain('bg-gradient-to-br');
    expect(card.className).toContain('from-white');
    expect(card.className).toContain('to-paper-100');
    expect(card.className).not.toContain('bg-white');
  });

  it('forwards the `as` prop so framer-motion components can own the base surface styling', () => {
    const Fake = ({ children, className, ...props }) => (
      <section data-testid="fake-motion" className={className} {...props}>
        {children}
      </section>
    );
    render(<Card as={Fake} variant="surface">content</Card>);
    const card = screen.getByTestId('fake-motion');
    expect(card.tagName).toBe('SECTION');
    expect(card.className).toContain('bg-gradient-to-br');
  });
});
