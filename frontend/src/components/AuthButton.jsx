import React, { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Button from './ui/Button';
import Modal from './ui/Modal';

/**
 * The app's single sign-in / sign-out control.
 *
 * Every auth affordance in the app routes through this component — the Navbar,
 * and the SignInGate that pages render when there is no user. Nothing should
 * hand-roll its own login button or sign-in modal; that previously caused two
 * competing "Login" buttons to appear on screen at the same time.
 *
 * Presentation is left to the caller via `variant`/`className` so the same
 * control can sit quietly in the Navbar and read as the primary action inside
 * a sign-in gate.
 */
export default function AuthButton({ variant = 'secondary', className = '' }) {
    const [user, setUser] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
    };

    if (user) {
        return (
            <>
                <Button
                    variant={variant}
                    className={className}
                    onClick={() => setShowLogoutConfirm(true)}
                >
                    Sign out
                </Button>

                <Modal
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    className="p-8 flex flex-col gap-4 items-center max-w-sm w-full"
                    labelledBy="logout-confirm-heading"
                >
                    <h3 id="logout-confirm-heading" className="font-display text-2xl font-semibold text-ink-900 text-center">
                        Sign out?
                    </h3>
                    <p className="text-ink-500 text-center text-sm">
                        You can sign back in any time — your projects and recordings stay saved.
                    </p>
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <Button onClick={handleLogout} className="w-full justify-center">
                            Yes, sign out
                        </Button>
                        <Button
                            variant="subtle"
                            onClick={() => setShowLogoutConfirm(false)}
                            className="w-full justify-center"
                        >
                            Cancel
                        </Button>
                    </div>
                </Modal>
            </>
        );
    }

    return (
        <Button variant={variant} className={className} onClick={loginWithGoogle}>
            Sign in
        </Button>
    );
}
