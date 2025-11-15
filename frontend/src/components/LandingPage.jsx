import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import AuthButton from './AuthButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from './Navbar.jsx';
import '../icons/fontawesome.js';

export default function LandingPage() {
  const [user] = useAuthState(auth);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const handleProtectedClick = (e, dest) => {
    if (!user) {
      e.preventDefault();
      setShowLogin(true);
    } else {
      navigate(dest);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="text-center mt-16 md:mt-24 py-8 px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-[4rem] font-bold text-gray-900 leading-tight mb-5">
          <span>
            Speak. Upload. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700">Get Instant</span>
          </span>
          <br />
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700'>Feedback.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Your private speaking coach, powered by AI.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-medium text-lg shadow-md hover:bg-indigo-700 transition-colors"
            onClick={e => handleProtectedClick(e, '/analyze')}
          >
            <FontAwesomeIcon icon='microphone' className="mr-2" /> Record Speech
          </button>
          <button
            className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 font-medium rounded-full text-lg hover:bg-indigo-50 transition-colors"
            onClick={e => handleProtectedClick(e, '/analyze')}
          >
            <FontAwesomeIcon icon="cloud-arrow-up" className="mr-2" /> Upload Audio File
          </button>
        </div>
      </section>

      {/* Hero Image */}
      <div className="mt-12 w-full flex justify-center px-4">
        <div className="relative max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl">
          <img src="/wave.png" alt="Speech wave visualization" className="w-full h-[320px] object-cover object-center" />
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl flex items-center gap-3 text-sm font-medium text-gray-800">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span>AI analyzing speech patterns in real-time...</span>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="mt-24 md:mt-32 py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get professional speech analysis in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center border border-indigo-100">
            <div className="bg-indigo-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon="cloud-arrow-up" className="text-indigo-600 text-3xl" />
            </div>
            <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold text-sm">1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Your Speech</h3>
            <p className="text-gray-600 leading-relaxed">Record directly or upload an audio file. We support MP3, WAV, and other common formats up to 20MB.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center border border-purple-100">
            <div className="bg-purple-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon="bolt" className="text-purple-600 text-3xl" />
            </div>
            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold text-sm">2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Analysis</h3>
            <p className="text-gray-600 leading-relaxed">Our AI analyzes your speech for pace, clarity, filler words, and provides personalized feedback based on your rubric.</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center border border-green-100">
            <div className="bg-green-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon="chart-line" className="text-green-600 text-3xl" />
            </div>
            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold text-sm">3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Get Insights</h3>
            <p className="text-gray-600 leading-relaxed">Receive detailed metrics, AI-generated feedback, and actionable improvements to enhance your speaking skills.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-16 py-16 px-6 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose SpeechScore?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Everything you need to improve your public speaking skills</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="gauge" className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Pace Analysis</h3>
                <p className="text-gray-600 text-sm">Get real-time WPM metrics and personalized pace recommendations for optimal delivery.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-red-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="magic-wand-sparkles" className="text-red-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Filler Word Detection</h3>
                <p className="text-gray-600 text-sm">Identify and reduce "um", "uh", and other filler words that distract from your message.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="star" className="text-green-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Clarity Scoring</h3>
                <p className="text-gray-600 text-sm">Measure speech clarity with AI-powered confidence scoring and detailed feedback.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="clipboard-list" className="text-yellow-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Custom Rubrics</h3>
                <p className="text-gray-600 text-sm">Evaluate your speech against custom rubrics tailored to your specific goals and requirements.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="circle-check" className="text-purple-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">AI-Powered Feedback</h3>
                <p className="text-gray-600 text-sm">Receive strengths and improvement suggestions powered by advanced AI analysis.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-xl p-3 flex-shrink-0">
                <FontAwesomeIcon icon="chart-simple" className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">Save and review your analyses over time to track your improvement journey.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Improve Your Speaking?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">Join thousands of users who are already enhancing their communication skills with AI-powered feedback.</p>
          <button
            className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-gray-50 transition-all transform hover:scale-105"
            onClick={e => handleProtectedClick(e, '/analyze')}
          >
            <FontAwesomeIcon icon="microphone" className="mr-2" /> Get Started Free
          </button>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col gap-4 items-center max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <FontAwesomeIcon icon="user-circle" className="text-indigo-400 text-6xl mb-2" />
            <h2 className="font-bold text-2xl text-gray-800 text-center mb-1">Sign in Required</h2>
            <p className="text-gray-500 text-center mb-3">Sign in with Google to access your speech analysis and feedback features.</p>
            <div className="flex flex-col items-center w-full gap-2">
              <AuthButton />
              <button className="mt-2 text-gray-500 hover:text-gray-700 text-sm transition-colors" onClick={() => setShowLogin(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
