import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to avoid needing to load icons
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

// AuthButton uses onAuthStateChanged directly from firebase/auth.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  },
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

import SignInGate from '../components/ui/SignInGate';

describe('SignInGate', () => {
  it('renders the icon, heading, message, and AuthButton', () => {
    render(<SignInGate message="Sign in to view your projects." />);

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Sign in Required')).toBeInTheDocument();
    expect(screen.getByText('Sign in to view your projects.')).toBeInTheDocument();
    // AuthButton renders a "Sign in" button when there is no authenticated user.
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // The gate is the app's ONLY sign-in surface. It must expose exactly one
  // auth control -- the landing page used to hand-roll a near-copy of this
  // modal, which put a second competing login button on screen next to the
  // Navbar's.
  it('exposes exactly one auth control', () => {
    render(<SignInGate message="Sign in to view your projects." />);
    expect(screen.getAllByRole('button', { name: /sign in/i })).toHaveLength(1);
  });

  it('is not dismissible by default', () => {
    render(<SignInGate message="Sign in to view your projects." />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('offers a cancel affordance when given an onClose handler', () => {
    const onClose = vi.fn();
    render(<SignInGate message="Sign in to continue." onClose={onClose} />);

    const cancel = screen.getByRole('button', { name: /cancel/i });
    cancel.click();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders different text for different message props', () => {
    const { rerender } = render(
      <SignInGate message="Sign in with Google to access your speech analysis and feedback features." />
    );
    expect(
      screen.getByText('Sign in with Google to access your speech analysis and feedback features.')
    ).toBeInTheDocument();

    rerender(<SignInGate message="Sign in with Google to view your dashboard and saved analyses." />);
    expect(
      screen.getByText('Sign in with Google to view your dashboard and saved analyses.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Sign in with Google to access your speech analysis and feedback features.')
    ).not.toBeInTheDocument();
  });
});
