import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('fake-token'),
    },
  },
}));

vi.mock('../config', () => ({
  API_URL: 'http://localhost:8000',
}));

import CoachChat from '../components/CoachChat';

// jsdom doesn't implement scrollIntoView; CoachChat calls it on every
// messages-list update to keep the latest message in view.
Element.prototype.scrollIntoView = vi.fn();

// Regression coverage for the send button's migration from a raw <button> to
// the shared <Button variant="ghost" size="icon">, which needed Button to
// grow a size prop (tighter padding/radius than the default) and a disabled
// treatment on the ghost variant (gray, no hover) since native `disabled`
// alone left it looking identical to the enabled state.
describe('CoachChat send button', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Here is some coaching feedback.' }),
    });
  });

  it('is disabled and shows the muted disabled treatment when the input is empty', () => {
    render(<CoachChat transcript="hello" rubricFeedback={{}} />);

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();
    expect(sendButton.className).toContain('disabled:text-gray-300');
    // Icon-only sizing, not the default px-4 py-2 pill.
    expect(sendButton.className).toContain('p-2');
    expect(sendButton.className).toContain('rounded-lg');
    expect(sendButton.className).not.toContain('px-4 py-2');
  });

  it('enables the send button once text is entered and sends on click', async () => {
    render(<CoachChat transcript="hello" rubricFeedback={{}} />);

    const textarea = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: 'How was my pacing?' } });

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeEnabled();

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Here is some coaching feedback.')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/coach/chat',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
      })
    );
  });
});
