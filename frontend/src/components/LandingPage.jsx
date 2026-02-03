import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import AuthButton from './AuthButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from './Navbar.jsx';
import '../icons/fontawesome.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

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

  const handleProtectedClick = (e, dest = '/dashboard') => {
    if (!user) {
      e?.preventDefault();
      setShowLogin(true);
    } else {
      navigate(dest);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-indigo-100">
            <FontAwesomeIcon icon="wand-magic-sparkles" className="text-xs" />
            <span>AI practice studio for high-stakes speaking</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            Practice with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">coach</span> that actually makes you better.
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Record, analyze, and iterate on your speeches with an AI coach that understands your specific scenario—from job interviews to debates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              className="text-lg px-8 py-4 h-auto shadow-indigo-200"
              onClick={(e) => handleProtectedClick(e, '/dashboard')}
            >
              Start a practice run <FontAwesomeIcon icon="arrow-right" />
            </Button>
            <Button
              variant="secondary"
              className="text-lg px-8 py-4 h-auto"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See how it works
            </Button>
          </div>
        </div>

        {/* Hero Visual - Mockup */}
        <div className="relative">
          {/* Main App Window Mockup */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden relative z-10 transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
            {/* Fake Title Bar */}
            <div className="h-4 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            {/* Content Mockup */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Project: Sales Pitch</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Draft 3 • 4m 12s</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full border border-emerald-200">
                  Score: 88
                </span>
              </div>
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Pace</div>
                  <div className="font-bold text-indigo-700">145 wpm</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Fillers</div>
                  <div className="font-bold text-indigo-700">2.1%</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Clarity</div>
                  <div className="font-bold text-indigo-700">High</div>
                </div>
              </div>
              {/* Mock Chat Snippet */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-gray-100">
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon="wand-magic-sparkles" className="text-purple-600 text-xs" />
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-gray-700 border border-gray-100">
                    <strong className="block text-gray-900 mb-1 text-xs uppercase">Coach</strong>
                    Your opening hook is much stronger in this draft! I noticed you slowed down for emphasis on the value proposition.
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative Backdrops */}
          <div className="absolute -top-6 -right-6 w-full h-full bg-indigo-100/50 rounded-2xl -z-10 transform rotate-3"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-200/50 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Improve in 3 steps</h2>
          <p className="text-lg text-gray-600">No more guesswork. Just record, analyze, and iterate.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: 'folder-plus',
              color: 'text-indigo-600',
              bg: 'bg-indigo-100',
              title: "1. Create & Choose",
              desc: "Start a project and pick a scenario (e.g., Job Interview, Debate) to get scoring that matches your goal."
            },
            {
              icon: 'microphone',
              color: 'text-purple-600',
              bg: 'bg-purple-100',
              title: "2. Record & Analyze",
              desc: "Record your speech. Get instant metrics on pace and filler words, plus an interactive transcript."
            },
            {
              icon: 'comment-dots',
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
              title: "3. Ask the Coach",
              desc: "Chat with the AI coach to fix specific issues, then record a new draft to see your progress."
            }
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6">
              <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <FontAwesomeIcon icon={step.icon} className={`${step.color} text-2xl`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to master delivery</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">From specific scenarios to granular transcript analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all border-indigo-50/50">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="clipboard-list" className="text-indigo-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Projects & Scenarios</h3>
                <p className="text-gray-600 leading-relaxed">
                  Don't just "speak." Organize speeches by goal. Use scenario-aware rubrics for interviews, pitches, debates, and more to get relevant scoring.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all border-purple-50/50">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="list" className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Transcript</h3>
                <p className="text-gray-600 leading-relaxed">
                  Click on any word to replay audio from that exact moment. See filler words and pacing warnings highlighted right in the text.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all border-emerald-50/50">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="comment-dots" className="text-emerald-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ask the Coach</h3>
                <p className="text-gray-600 leading-relaxed">
                  Stuck? Chat with an AI coach that knows your transcript and score. Ask "How do I sound more confident?" and get specific advice.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all border-amber-50/50">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="chart-line" className="text-amber-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Progress over Drafts</h3>
                <p className="text-gray-600 leading-relaxed">
                  Record draft 1, get feedback, then record draft 2. See exactly how your pace, fillers, and clarity improve across attempts.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Before vs After Strip */}
      <section className="py-20 px-6 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px]"></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="opacity-60 space-y-4 text-center md:text-left">
            <div className="uppercase tracking-widest text-sm font-bold text-gray-400">The Old Way</div>
            <h3 className="text-2xl font-bold text-gray-300">Record, cringe, and guess what to fix.</h3>
            <p className="text-gray-400">Aimless practice doesn't lead to perfection. It leads to bad habits.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="uppercase tracking-widest text-sm font-bold text-indigo-300 mb-2">SpeechScore Way</div>
            <h3 className="text-2xl font-bold text-white mb-4">Record, get targeted feedback, and improve.</h3>
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-gray-900 font-bold">
                <FontAwesomeIcon icon="check" />
              </div>
              <p className="text-indigo-100 font-medium">Results you can actually measure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Conversation Snippet */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Like having a pro coach in your pocket</h2>

          <Card className="text-left max-w-2xl mx-auto bg-white border-2 border-gray-100 p-8 shadow-2xl relative">
            <div className="space-y-6">

              {/* User Msg */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white py-3 px-5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                  <p className="text-sm">My introduction feels weak. How can I make it stronger?</p>
                </div>
              </div>

              {/* Coach Msg */}
              <div className="flex justify-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 border border-purple-200">
                  <FontAwesomeIcon icon="wand-magic-sparkles" className="text-purple-600 text-sm" />
                </div>
                <div className="bg-gray-100 text-gray-800 py-3 px-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed">
                    In your first 30 seconds, you start with background context instead of the main point.
                    <strong>Try opening with a clear, one-sentence hook</strong> like "Marketing is changing," focused on the outcome.
                  </p>
                  <button className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <FontAwesomeIcon icon="rotate-right" /> Try picking the "Persuasive Pitch" scenario
                  </button>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-indigo-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to improve your next speech?</h2>
          <p className="text-xl text-indigo-200 mb-10">Join the students and professionals using SpeechScore to communicate with confidence.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              className="bg-white text-indigo-900 hover:bg-indigo-50 text-lg px-8 py-4 h-auto"
              onClick={(e) => handleProtectedClick(e, '/dashboard')}
            >
              Start a practice run
            </Button>
          </div>
          <p className="mt-8 text-sm text-indigo-400 opacity-80">
            <FontAwesomeIcon icon="lock" className="mr-2" />
            Private & Secure. Your recordings are yours.
          </p>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 items-center max-w-sm w-full relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
              <FontAwesomeIcon icon="user-circle" className="text-indigo-600 text-3xl" />
            </div>
            <div className="text-center">
              <h2 className="font-bold text-2xl text-gray-900 mb-2">Sign in Required</h2>
              <p className="text-gray-500 text-sm">Sign in with Google to access your dashboard and save your progress.</p>
            </div>
            <div className="w-full space-y-3">
              <AuthButton />
              <button className="text-gray-400 hover:text-gray-600 text-sm w-full text-center py-2 transition-colors" onClick={() => setShowLogin(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
