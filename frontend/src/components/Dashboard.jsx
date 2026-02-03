import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import Navbar from './Navbar';
import ResultPanel from './ResultPanel';
import AuthButton from './AuthButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Dashboard() {
    const [user, loading, error] = useAuthState(auth);
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectRubricPreset, setNewProjectRubricPreset] = useState('General Speaking');

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch old feedback (backward compatibility)
                const q = query(collection(db, "feedback"), where("uid", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => {
                    const ta = a?.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                    const tb = b?.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                    return tb - ta;
                });
                setFeedback(data);

                // Fetch projects
                const projectsRef = collection(db, `users/${user.uid}/projects`);
                const projectsSnapshot = await getDocs(projectsRef);
                const projectsData = await Promise.all(
                    projectsSnapshot.docs.map(async (doc) => {
                        const projectData = { id: doc.id, ...doc.data() };
                        // Get recording count
                        const recordingsRef = collection(db, `users/${user.uid}/projects/${doc.id}/recordings`);
                        const countSnapshot = await getCountFromServer(recordingsRef);
                        projectData.recordingCount = countSnapshot.data().count;
                        return projectData;
                    })
                );
                projectsData.sort((a, b) => {
                    const ta = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                    const tb = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                    return tb - ta;
                });
                setProjects(projectsData);
            } catch (err) {
                console.error("Error fetching data:", err);
                setFeedback([]);
                setProjects([]);
            }
        };
        fetchData();
    }, [user]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            alert('Please enter a project name');
            return;
        }

        try {
            const projectRef = await addDoc(collection(db, `users/${user.uid}/projects`), {
                name: newProjectName.trim(),
                description: newProjectDescription.trim() || '',
                rubricPreset: newProjectRubricPreset,
                createdAt: Timestamp.now(),
            });
            setShowNewProjectModal(false);
            setNewProjectName('');
            setNewProjectDescription('');
            setNewProjectRubricPreset('General Speaking');
            navigate(`/project/${projectRef.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project');
        }
    };

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
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.displayName}</h1>
                        <p className="text-gray-600 mt-1">Your projects and analyses</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon="plus" />
                            New Project
                        </button>
                        <Link
                            to="/analyze"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon="microphone" />
                            Quick Analyze
                        </Link>
                    </div>
                </div>

                {/* Projects Section */}
                {projects.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/project/${project.id}`}
                                    className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all block"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                        <FontAwesomeIcon icon="folder" className="text-indigo-500" />
                                    </div>
                                    {project.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                                    )}
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>
                                            <FontAwesomeIcon icon="file-audio" className="mr-1" />
                                            {project.recordingCount || 0} recording{project.recordingCount !== 1 ? 's' : ''}
                                        </span>
                                        {project.createdAt && (
                                            <span>
                                                {project.createdAt.toDate ?
                                                    project.createdAt.toDate().toLocaleDateString() :
                                                    'Recent'}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Legacy Feedback Section */}
                {feedback.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Analyses</h2>
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
                                                            {strengths.slice(0, 2).map((s, idx) => (
                                                                <span key={idx} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-1">{s}</span>
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
                    </div>
                )}

                {projects.length === 0 && feedback.length === 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 shadow-sm text-center">
                        <div className="text-indigo-500 text-6xl mb-4">
                            <FontAwesomeIcon icon="chart-line" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Get Started</h3>
                        <p className="text-gray-600 mb-6">Create a project to organize your speech recordings, or do a quick analysis.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowNewProjectModal(true)}
                                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition shadow-md"
                            >
                                <FontAwesomeIcon icon="folder-plus" className="mr-2" />
                                Create Project
                            </button>
                            <Link
                                to="/analyze"
                                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full font-medium hover:bg-purple-700 transition shadow-md"
                            >
                                <FontAwesomeIcon icon="microphone" className="mr-2" />
                                Quick Analyze
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewProjectModal(false)}>
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowNewProjectModal(false)}
                        >
                            <FontAwesomeIcon icon="times" />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Project</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g., FBLA State Finals"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    placeholder="Brief description of this project..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Scenario <span className="text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <select
                                    value={newProjectRubricPreset}
                                    onChange={(e) => setNewProjectRubricPreset(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {Object.keys(RUBRIC_PRESETS).map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    This will auto-fill the evaluation rubric for recordings in this project.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCreateProject}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                                >
                                    Create Project
                                </button>
                                <button
                                    onClick={() => setShowNewProjectModal(false)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
