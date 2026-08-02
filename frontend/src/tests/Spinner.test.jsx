import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Spinner from '../components/ui/Spinner';

describe('Spinner', () => {
    it('renders the sm size with h-8 w-8 classes', () => {
        render(<Spinner size="sm" />);
        const icon = screen.getByTestId('spinner-icon');
        expect(icon.className).toContain('h-8');
        expect(icon.className).toContain('w-8');
        expect(icon.className).not.toContain('h-12');
    });

    it('renders the lg size with h-12 w-12 classes', () => {
        render(<Spinner size="lg" />);
        const icon = screen.getByTestId('spinner-icon');
        expect(icon.className).toContain('h-12');
        expect(icon.className).toContain('w-12');
        expect(icon.className).not.toContain('h-8');
    });

    it('defaults to the lg size when none is given', () => {
        render(<Spinner />);
        const icon = screen.getByTestId('spinner-icon');
        expect(icon.className).toContain('h-12');
        expect(icon.className).toContain('w-12');
    });

    it('renders the label text when provided', () => {
        render(<Spinner label="Loading your dashboard..." />);
        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
    });

    it('does not render an empty label element when label is omitted', () => {
        const { container } = render(<Spinner />);
        expect(container.querySelector('p')).toBeNull();
    });

    it('renders the full-page wrapper classes when fullScreen is true', () => {
        render(<Spinner fullScreen label="Loading..." />);
        const wrapper = screen.getByTestId('spinner');
        expect(wrapper.className).toContain('min-h-screen');
        expect(wrapper.className).toContain('bg-paper-100');
        expect(wrapper.className).toContain('flex');
        expect(wrapper.className).toContain('items-center');
        expect(wrapper.className).toContain('justify-center');
    });

    it('renders the contained wrapper (no min-h-screen) when fullScreen is false or omitted', () => {
        render(<Spinner label="Loading results..." />);
        const wrapper = screen.getByTestId('spinner');
        expect(wrapper.className).not.toContain('min-h-screen');
        expect(wrapper.className).toContain('flex');
        expect(wrapper.className).toContain('items-center');
        expect(wrapper.className).toContain('justify-center');
    });
});
