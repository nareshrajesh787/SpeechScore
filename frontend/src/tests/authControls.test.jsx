import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span>Icon</span>,
}));

vi.mock('../firebase', () => ({
    auth: {},
    db: {},
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
}));

// Drives AuthButton's own subscription. Signed out by default.
const authUser = vi.hoisted(() => ({ current: null }));
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: (_auth, callback) => {
        callback(authUser.current);
        return () => { };
    },
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('react-firebase-hooks/auth', () => ({
    useAuthState: () => [authUser.current, false, undefined],
}));

import Navbar from '../components/Navbar';
import SignInGate from '../components/ui/SignInGate';

const AUTH_LABEL = /^(sign in|sign out)$/i;

describe('auth controls are never duplicated', () => {
    beforeEach(() => {
        authUser.current = null;
    });

    it('shows exactly one auth control in the navbar alone', () => {
        render(<MemoryRouter><Navbar /></MemoryRouter>);
        expect(screen.getAllByRole('button', { name: AUTH_LABEL })).toHaveLength(1);
    });

    // Regression guard for the duplication this refactor removed: the landing
    // page used to hand-roll its own sign-in modal, so opening it put a second
    // "Sign in" on screen alongside the navbar's. The gate now suppresses the
    // navbar's control while it is showing.
    it('shows exactly one auth control when a gate is open over the navbar', () => {
        render(
            <MemoryRouter>
                <Navbar />
                <SignInGate message="Sign in to continue." />
            </MemoryRouter>
        );

        const controls = screen.getAllByRole('button', { name: AUTH_LABEL });
        expect(controls).toHaveLength(1);
        // The surviving one is the gate's, which is the primary action.
        expect(controls[0].className).toContain('bg-brand-600');
    });

    it('restores the navbar control once the gate unmounts', () => {
        const { rerender } = render(
            <MemoryRouter>
                <Navbar />
                <SignInGate message="Sign in to continue." />
            </MemoryRouter>
        );
        expect(screen.getAllByRole('button', { name: AUTH_LABEL })).toHaveLength(1);

        act(() => {
            rerender(<MemoryRouter><Navbar /></MemoryRouter>);
        });

        const controls = screen.getAllByRole('button', { name: AUTH_LABEL });
        expect(controls).toHaveLength(1);
        // Back to the navbar's quieter treatment, not the gate's primary.
        expect(controls[0].className).not.toContain('bg-brand-600');
    });

    it('uses one shared control for signed-in users too', () => {
        authUser.current = { uid: 'u1', displayName: 'Test User' };
        render(<MemoryRouter><Navbar /></MemoryRouter>);

        const controls = screen.getAllByRole('button', { name: AUTH_LABEL });
        expect(controls).toHaveLength(1);
        expect(controls[0]).toHaveTextContent(/sign out/i);
    });
});
