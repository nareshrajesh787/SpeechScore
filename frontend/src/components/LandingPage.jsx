import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from './Navbar.jsx';
import '../icons/fontawesome.js';

export default function LandingPage() {

  return (
    <div className="bg-zinc-50 min-h-screen">
        <Navbar/>
        <div className="text-center mt-8 py-18 px-6 max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-[4.25rem] font-bold text-gray-900 leading-tight text-center">
                <span>
                    Speak. Upload. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700">
                        Get Instant
                    </span>
                </span>
                <br />
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700'>
                    Feedback.
                </span>
            </h1>
            <p className="text-xl font-medium md:text-xl text-gray-600 mt-6">
                Your private speaking coach, powered by AI.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-full font-medium text-lg shadow hover:bg-indigo-700 transition"><Link to={'/analyze'}>
                    <FontAwesomeIcon icon='microphone' /> Record Speech
                </Link></button>
                <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 font-medium rounded-full text-lg hover:bg-gray-100 transition"><Link to={'/analyze'}>
                    <FontAwesomeIcon icon="cloud-arrow-up" /> Upload Audio File
                </Link></button>
            </div>
        </div>
        <div className="mt-16 w-full flex justify-center px-4">
            <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden">
                <img
                    src="/wave.png"
                    alt="Speech wave"
                    className="w-full h-[280px] object-cover object-center rounded-2xl shadow-lg"
                />
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span>AI analyzing speech patterns...</span>
                </div>
            </div>
        </div>
    </div>

  );
}
