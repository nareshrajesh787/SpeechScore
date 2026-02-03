import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { auth, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Button from './ui/Button';

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
                    variant="ghost"
                    className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 w-full md:w-auto"
                    onClick={() => setShowLogoutConfirm(true)}
                >
                    Logout
                </Button>

                {showLogoutConfirm && createPortal(
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
                        <div
                            className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col gap-4 items-center max-w-md w-full animate-in fade-in zoom-in duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold text-gray-800 text-center mb-1">Sign Out</h3>
                            <p className="text-gray-500 text-center mb-3">Are you sure you want to sign out?</p>

                            <div className="flex flex-col gap-3 w-full">
                                <Button
                                    onClick={handleLogout}
                                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Yes, Sign Out
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="w-full justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    return (
        <Button
            variant="ghost"
            className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 w-full md:w-auto mx-auto"
            onClick={loginWithGoogle}
        >
            Login
        </Button>
    );
}
