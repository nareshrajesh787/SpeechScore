import React, { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Button from './ui/Button';
import Modal from './ui/Modal';

export default function AuthButton() {
    const [user, setUser] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
    }

    if (user) {
        return (
            <>
                <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setShowLogoutConfirm(true)}
                >
                    Logout
                </Button>

                <Modal
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    className="p-10 flex flex-col gap-4 items-center max-w-md w-full"
                    labelledBy="logout-confirm-heading"
                >
                    <h3 id="logout-confirm-heading" className="text-2xl font-bold text-ink-800 text-center mb-1">Sign Out</h3>
                    <p className="text-paper-500 text-center mb-3">Are you sure you want to sign out?</p>

                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={handleLogout}
                            className="w-full justify-center"
                        >
                            Yes, Sign Out
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
        <Button
            variant="outline"
            className="w-full md:w-auto mx-auto"
            onClick={loginWithGoogle}
        >
            Login
        </Button>
    );
}
