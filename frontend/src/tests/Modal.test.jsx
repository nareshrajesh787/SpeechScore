import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Modal from '../components/ui/Modal';

function FocusRestorationHarness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open trigger</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <button>Inside</button>
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Hidden content</p>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders children with role="dialog" and aria-modal="true" when isOpen is true', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Visible content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop, but not when clicking inside the dialog panel', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Panel content</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('Panel content'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus: Tab from the last element wraps to the first, Shift+Tab from the first wraps to the last', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );

    const first = screen.getByText('First');
    const last = screen.getByText('Last');

    // On open, focus should have moved to the first focusable element.
    expect(first).toHaveFocus();

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('restores focus to the previously-focused element on close', () => {
    render(<FocusRestorationHarness />);

    const trigger = screen.getByText('Open trigger');
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    expect(screen.getByText('Inside')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveFocus();
  });
});
