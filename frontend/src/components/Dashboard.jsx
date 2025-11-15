import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Navbar from './Navbar';
import ResultPanel from './ResultPanel';
import AuthButton from './AuthButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Dashboard() {
    const [user, loading, error] = useAuthState(auth);
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchFeedback = async () => {
            try {
                const q = query(collection(db, "feedback"), where("uid", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => {
                    const ta = a?.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                    const tb = b?.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                    return tb - ta;
                });
                setFeedback(data);
            } catch (err) {
                console.error("Error fetching feedback:", err);
                setFeedback([]);
            }
        };
        fetchFeedback();
    }, [user]);

    if (loading) {
        return (
            <div className="bg-zinc-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="bg-zinc-50 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col gap-4 items-center max-w-md w-full">
                    <FontAwesomeIcon icon="user-circle" className="text-indigo-400 text-6xl mb-2" />
                    <h2 className="font-bold text-2xl text-gray-800 text-center mb-1">Sign in Required</h2>
                    <p className="text-gray-500 text-center mb-3">Sign in with Google to view your dashboard and saved analyses.</p>
                    <div className="flex flex-col items-center w-full gap-2">
                        <AuthButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 min-h-screen">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.displayName}</h1>
                    <p className="text-gray-600 mt-1">Your past analyses at a glance</p>
                </div>

                {feedback.length === 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 shadow-sm text-center">
                        <div className="text-indigo-500 text-6xl mb-4">
                            <FontAwesomeIcon icon="chart-line" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No analyses yet</h3>
                        <p className="text-gray-600 mb-6">Get started by analyzing your first speech recording.</p>
                        <Link
                            to="/analyze"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition shadow-md"
                        >
                            <FontAwesomeIcon icon="microphone" className="mr-2" />
                            Analyze Speech
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedback.map((fb) => {
                            const date = fb?.timestamp?.toDate ? fb.timestamp.toDate() : null;
                            const dateLabel = date ? date.toLocaleString() : "";
                            const strengths = fb?.ai_feedback?.strengths || [];
                            const improvements = fb?.ai_feedback?.improvements || [];
                            const transcriptSnippet = (fb?.transcript || "").slice(0, 160);
                            const rubricTotal = fb?.rubric_total;
                            const rubricMax = fb?.rubric_max;
                            const scoreLabel = rubricTotal != null && rubricMax != null ? `${rubricTotal}/${rubricMax}` : "—";

                            // Handle filler_count - it's a dict, so sum the values
                            const fillerCount = fb?.filler_count;
                            const totalFillers = typeof fillerCount === 'object' && fillerCount !== null
                                ? Object.values(fillerCount).reduce((sum, count) => sum + count, 0)
                                : (typeof fillerCount === 'number' ? fillerCount : "—");

                            return (
                                <button onClick={() => setSelected(fb)} key={fb.id} className="text-left bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-sm border border-indigo-100 p-5 flex flex-col hover:shadow-md hover:border-indigo-200 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-lg font-semibold text-gray-900">Analysis</h2>
                                        {dateLabel && <span className="text-xs text-gray-500">{dateLabel}</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">WPM</p>
                                            <p className="text-xl font-bold text-indigo-700">{fb?.wpm ?? "—"}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Fillers</p>
                                            <p className="text-xl font-bold text-indigo-700">{totalFillers}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Clarity</p>
                                            <p className="text-xl font-bold text-indigo-700">{fb?.clarity_score ?? "—"}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Rubric</p>
                                            <p className="text-xl font-bold text-indigo-700">{scoreLabel}</p>
                                        </div>
                                    </div>
                                    {fb?.pace_feedback && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-700"><span className="font-semibold">Pace:</span> {fb.pace_feedback}</p>
                                        </div>
                                    )}
                                    {transcriptSnippet && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Transcript</p>
                                            <p className="text-sm text-gray-700 line-clamp-3">{transcriptSnippet}{fb.transcript.length > 160 ? '…' : ''}</p>
                                        </div>
                                    )}
                                    {(strengths.length > 0 || improvements.length > 0) && (
                                        <div className="mt-auto">
                                            {strengths.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-gray-600 mb-1">AI Strengths</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {strengths.map((s, idx) => (
                                                            <span key={idx} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-1">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {improvements.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 mb-1">AI Improvements</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {improvements.map((s, idx) => (
                                                            <span key={idx} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-1">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                            aria-label="Close"
                            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                            onClick={() => setSelected(null)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="overflow-y-auto max-h-[90vh]">
                            <ResultPanel result={selected} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
