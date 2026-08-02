import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from './Navbar.jsx';
import '../icons/fontawesome.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import SignInGate from './ui/SignInGate.jsx';

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
    <div className="bg-paper-100 min-h-screen font-sans text-ink-900 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-brand-100">
            <FontAwesomeIcon icon="wand-magic-sparkles" className="text-xs" />
            <span>AI practice studio for high-stakes speaking</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-ink-900 mb-6 leading-[1.1]">
            Practice with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">coach</span> that actually makes you better.
          </h1>
          <p className="text-xl text-ink-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Record, analyze, and iterate on your speeches with an AI coach that understands your specific scenario—from job interviews to debates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              className="text-lg px-8 py-4 h-auto shadow-brand-200"
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
          <div className="bg-white rounded-2xl shadow-overlay border border-paper-300 overflow-hidden relative z-10 transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
            {/* Fake Title Bar */}
            <div className="h-4 bg-paper-100 border-b border-paper-200 flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            {/* Content Mockup */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink-900">Project: Sales Pitch</h3>
                  <p className="text-xs text-ink-500 uppercase tracking-wide font-medium">Draft 3 • 4m 12s</p>
                </div>
                <span className="bg-good-100 text-good-700 text-sm font-bold px-3 py-1 rounded-full border border-good-200">
                  Score: 88
                </span>
              </div>
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-brand-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-ink-500 mb-1">Pace</div>
                  <div className="font-bold text-brand-700">145 wpm</div>
                </div>
                <div className="bg-brand-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-ink-500 mb-1">Fillers</div>
                  <div className="font-bold text-brand-700">2.1%</div>
                </div>
                <div className="bg-brand-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-ink-500 mb-1">Clarity</div>
                  <div className="font-bold text-brand-700">High</div>
                </div>
              </div>
              {/* Mock Chat Snippet */}
              <div className="bg-paper-100 rounded-xl p-4 border border-paper-200">
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon="wand-magic-sparkles" className="text-brand-600 text-xs" />
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-ink-700 border border-paper-200">
                    <strong className="block text-ink-900 mb-1 text-xs uppercase">Coach</strong>
                    Your opening hook is much stronger in this draft! I noticed you slowed down for emphasis on the value proposition.
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative Backdrops */}
          <div className="absolute -top-6 -right-6 w-full h-full bg-brand-100/50 rounded-2xl -z-10 transform rotate-3"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-brand-200/50 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-y border-paper-200">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl font-bold text-ink-900 mb-4">Improve in 3 steps</h2>
          <p className="text-lg text-ink-600">No more guesswork. Just record, analyze, and iterate.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: 'folder-plus',
              color: 'text-brand-600',
              bg: 'bg-brand-100',
              title: "1. Create & Choose",
              desc: "Start a project and pick a scenario (e.g., Job Interview, Debate) to get scoring that matches your goal."
            },
            {
              icon: 'microphone',
              color: 'text-brand-600',
              bg: 'bg-brand-100',
              title: "2. Record & Analyze",
              desc: "Record your speech. Get instant metrics on pace and filler words, plus an interactive transcript."
            },
            {
              icon: 'comment-dots',
              color: 'text-brand-600',
              bg: 'bg-brand-100',
              title: "3. Ask the Coach",
              desc: "Chat with the AI coach to fix specific issues, then record a new draft to see your progress."
            }
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6">
              <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <FontAwesomeIcon icon={step.icon} className={`${step.color} text-2xl`} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900 mb-3">{step.title}</h3>
              <p className="text-ink-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-paper-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-900 mb-4">Everything you need to master delivery</h2>
            <p className="text-lg text-ink-600 max-w-2xl mx-auto">From specific scenarios to granular transcript analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-raised transition-all border-brand-50/50">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="clipboard-list" className="text-brand-600 text-xl" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900 mb-2">Projects & Scenarios</h3>
                <p className="text-ink-600 leading-relaxed">
                  Don't just "speak." Organize speeches by goal. Use scenario-aware rubrics for interviews, pitches, debates, and more to get relevant scoring.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-raised transition-all border-brand-50/50">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="list" className="text-brand-600 text-xl" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900 mb-2">Interactive Transcript</h3>
                <p className="text-ink-600 leading-relaxed">
                  Click on any word to replay audio from that exact moment. See filler words and pacing warnings highlighted right in the text.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-raised transition-all border-brand-50/50">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="comment-dots" className="text-brand-600 text-xl" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900 mb-2">Ask the Coach</h3>
                <p className="text-ink-600 leading-relaxed">
                  Stuck? Chat with an AI coach that knows your transcript and score. Ask "How do I sound more confident?" and get specific advice.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col md:flex-row gap-6 hover:shadow-raised transition-all border-accent-100/50">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon="chart-line" className="text-accent-600 text-xl" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900 mb-2">Progress over Drafts</h3>
                <p className="text-ink-600 leading-relaxed">
                  Record draft 1, get feedback, then record draft 2. See exactly how your pace, fillers, and clarity improve across attempts.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Before vs After Strip */}
      <section className="py-20 px-6 bg-brand-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-400 rounded-full blur-[128px]"></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="opacity-60 space-y-4 text-center md:text-left">
            <div className="uppercase tracking-widest text-sm font-bold text-white/50">The Old Way</div>
            <h3 className="font-display text-2xl font-bold text-white/80">Record, cringe, and guess what to fix.</h3>
            <p className="text-white/60">Aimless practice doesn't lead to perfection. It leads to bad habits.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="uppercase tracking-widest text-sm font-bold text-brand-300 mb-2">SpeechScore Way</div>
            <h3 className="font-display text-2xl font-bold text-white mb-4">Record, get targeted feedback, and improve.</h3>
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 rounded-full bg-good-500 flex items-center justify-center text-ink-900 font-bold">
                <FontAwesomeIcon icon="check" />
              </div>
              <p className="text-brand-100 font-medium">Results you can actually measure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Conversation Snippet */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-ink-900 mb-12">Like having a pro coach in your pocket</h2>

          <Card className="text-left max-w-2xl mx-auto bg-white border-2 border-paper-200 p-8 shadow-overlay relative">
            <div className="space-y-6">

              {/* User Msg */}
              <div className="flex justify-end">
                <div className="bg-brand-600 text-white py-3 px-5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                  <p className="text-sm">My introduction feels weak. How can I make it stronger?</p>
                </div>
              </div>

              {/* Coach Msg */}
              <div className="flex justify-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 border border-brand-200">
                  <FontAwesomeIcon icon="wand-magic-sparkles" className="text-brand-600 text-sm" />
                </div>
                <div className="bg-paper-100 text-ink-800 py-3 px-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed">
                    In your first 30 seconds, you start with background context instead of the main point.
                    <strong>Try opening with a clear, one-sentence hook</strong> like "Marketing is changing," focused on the outcome.
                  </p>
                  <button className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <FontAwesomeIcon icon="rotate-right" /> Try picking the "Persuasive Pitch" scenario
                  </button>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-brand-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-6">Ready to improve your next speech?</h2>
          <p className="text-xl text-brand-200 mb-10">Join the students and professionals using SpeechScore to communicate with confidence.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="inverted"
              className="text-lg px-8 py-4 h-auto"
              onClick={(e) => handleProtectedClick(e, '/dashboard')}
            >
              Start a practice run
            </Button>
          </div>
          <p className="mt-8 text-sm text-brand-400 opacity-80">
            <FontAwesomeIcon icon="lock" className="mr-2" />
            Private & Secure. Your recordings are yours.
          </p>
        </div>
      </section>

      {/* Shared sign-in surface — deliberately NOT a bespoke modal, so the
          landing page can't drift from the gate the rest of the app uses. */}
      {showLogin && (
        <SignInGate
          message="Sign in with Google to access your dashboard and save your progress."
          onClose={() => setShowLogin(false)}
        />
      )}
    </div >
  );
}
