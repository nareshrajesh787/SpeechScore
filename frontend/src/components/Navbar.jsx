import React from 'react';
import { Link } from 'react-router-dom';
import AuthButton from './AuthButton.jsx';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase.js';

export default function Navbar() {
    const [user] = useAuthState(auth);

    return (
        <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md shadow-lg">
            <nav>
                <div className="lg:mx-10 md:mx-8 sm:mx-4 px-4 py-4 flex justify-between items-center">
                    <Link to={"/"} className="flex items-center gap-3 group">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg w-10 h-10 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white font-bold text-lg">SS</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            SpeechScore
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user && (
                            <Link to={"/dashboard"} className="font-medium text-gray-600 px-4 py-3 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                                Dashboard
                            </Link>
                        )}
                        <Link to={"/analyze"} className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
                            Analyze
                        </Link>
                        <AuthButton />
                    </div>
                </div>
            </nav>
        </header>
    );
}
