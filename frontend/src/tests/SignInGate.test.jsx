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
    // AuthButton renders a "Login" button when there is no authenticated user.
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
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
