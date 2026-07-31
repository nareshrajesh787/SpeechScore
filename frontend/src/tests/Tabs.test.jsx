import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs from '../components/ui/Tabs';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

const tabs = [
    { id: 'upload', label: 'Upload File', icon: 'cloud-arrow-up' },
    { id: 'studio', label: 'Studio Mode', icon: 'microphone' },
];

describe('Tabs', () => {
    it('renders all tabs with their labels', () => {
        render(<Tabs tabs={tabs} activeTab="upload" onChange={vi.fn()} />);
        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Studio Mode')).toBeInTheDocument();
    });

    it('applies the active styles to the active tab and not the inactive tab', () => {
        render(<Tabs tabs={tabs} activeTab="upload" onChange={vi.fn()} />);
        const activeButton = screen.getByText('Upload File').closest('button');
        const inactiveButton = screen.getByText('Studio Mode').closest('button');

        expect(activeButton.className).toContain('bg-indigo-600');
        expect(activeButton.className).toContain('text-white');

        expect(inactiveButton.className).not.toContain('bg-indigo-600');
        expect(inactiveButton.className).not.toContain('text-white');
        expect(inactiveButton.className).toContain('text-gray-600');
    });

    it('calls onChange with the clicked tab id', () => {
        const onChange = vi.fn();
        render(<Tabs tabs={tabs} activeTab="upload" onChange={onChange} />);

        fireEvent.click(screen.getByText('Studio Mode'));
        expect(onChange).toHaveBeenCalledWith('studio');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('calls onChange with its own id even when clicking the already-active tab', () => {
        const onChange = vi.fn();
        render(<Tabs tabs={tabs} activeTab="upload" onChange={onChange} />);

        fireEvent.click(screen.getByText('Upload File'));
        expect(onChange).toHaveBeenCalledWith('upload');
    });

    it('shares width equally (flex-1) across tabs by default', () => {
        render(<Tabs tabs={tabs} activeTab="upload" onChange={vi.fn()} />);
        const activeButton = screen.getByText('Upload File').closest('button');
        expect(activeButton.className).toContain('flex-1');
    });

    it('shrinks to fit content when fullWidth is false', () => {
        render(<Tabs tabs={tabs} activeTab="upload" onChange={vi.fn()} fullWidth={false} />);
        const activeButton = screen.getByText('Upload File').closest('button');
        expect(activeButton.className).not.toContain('flex-1');

        const container = activeButton.parentElement;
        expect(container.className).toContain('w-fit');
    });
});
