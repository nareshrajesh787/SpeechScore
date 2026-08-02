import React from 'react';
import { Link } from 'react-router-dom';
import AuthButton from './AuthButton.jsx';
import Button from './ui/Button';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase.js';
import { useSignInGateOpen } from '../utils/signInGateStore';

export default function Navbar() {
    const [user] = useAuthState(auth);
    const signInGateOpen = useSignInGateOpen();

    return (
        <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md shadow-lg">
            <nav>
                <div className="lg:mx-10 md:mx-8 sm:mx-4 px-3 sm:px-4 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-y-2">
                    <Link to={"/"} className="flex items-center gap-2 sm:gap-3 group">
                        <div className="bg-gradient-to-br from-brand-600 to-brand-400 rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                            <span className="text-white font-bold text-base sm:text-lg">SS</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                            SpeechScore
                        </span>
                    </Link>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {user && (
                            <Link to={"/dashboard"} className="font-medium text-ink-600 px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                                Dashboard
                            </Link>
                        )}
                        <Button
                            as={Link}
                            to={"/analyze"}
                            className="px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-full shadow-md hover:shadow-lg"
                        >
                            Analyze
                        </Button>
                        {/* Suppressed while a sign-in gate is showing: that gate
                            already offers the only auth control the user needs,
                            and two competing "Sign in" buttons is the exact
                            duplication this navbar used to create.
                            `subtle` so it doesn't compete with Analyze, which is
                            the navbar's actual primary action. */}
                        {!signInGateOpen && (
                            <AuthButton variant="subtle" className="px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base" />
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
