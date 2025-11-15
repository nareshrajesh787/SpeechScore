import React from 'react';
import { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthButton() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    if (user) {
        return (
            <button className="border-2 border-indigo-600 text-indigo-600 font-medium px-5 py-3 rounded-full hover:bg-indigo-50 transition-colors" onClick={logout}>
                Logout
            </button>
        );
    }

    return (
        <button
            className="border-2 border-indigo-600 text-indigo-600 font-medium px-5 py-3 rounded-full hover:bg-indigo-50 transition-colors"
            onClick={loginWithGoogle}
        >
            Login
        </button>
    );
}
