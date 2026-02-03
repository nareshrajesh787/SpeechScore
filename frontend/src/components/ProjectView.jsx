import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { deleteRecording as deleteRecordingUtil } from '../utils/projectUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from './Navbar';
import AuthButton from './AuthButton';
import TrendCharts from './charts/TrendCharts';

export default function ProjectView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [user, loading] = useAuthState(auth);
    const [project, setProject] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [activeTab, setActiveTab] = useState('recordings'); // 'recordings' or 'trends'

    useEffect(() => {
        if (!user || !projectId) return;

        const fetchProjectData = async () => {
            try {
                setLoadingData(true);
                
                // Fetch project
                const projectRef = doc(db, `users/${user.uid}/projects/${projectId}`);
                const projectSnap = await getDoc(projectRef);
                
                if (!projectSnap.exists()) {
                    navigate('/dashboard');
                    return;
                }
                
                setProject({ id: projectSnap.id, ...projectSnap.data() });
                
                // Fetch recordings
                const recordingsRef = collection(db, `users/${user.uid}/projects/${projectId}/recordings`);
                const recordingsQuery = query(
                    recordingsRef,
                    orderBy('createdAt', 'desc')
                );
                const recordingsSnap = await getDocs(recordingsQuery);
                
                const recordingsData = recordingsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setRecordings(recordingsData);
            } catch (error) {
                console.error('Error fetching project data:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchProjectData();
    }, [user, projectId, navigate]);

    const handleDeleteRecording = async (recording) => {
        if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) return;
        
        try {
            await deleteRecordingUtil(
                user.uid,
                projectId,
                recording.id,
                recording.audioUrl || null
            );
            // Remove from local state
            setRecordings(recordings.filter(r => r.id !== recording.id));
            if (selectedRecording?.id === recording.id) {
                setSelectedRecording(null);
            }
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Failed to delete recording. Please try again.');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading || loadingData) {
        return (
            <div className="bg-zinc-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading project...</p>
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
                    <p className="text-gray-500 text-center mb-3">Sign in to view your projects.</p>
                    <AuthButton />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="bg-zinc-50 min-h-screen">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <p className="text-gray-600">Project not found</p>
                        <Link to="/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 min-h-screen">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Project Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Link 
                                to="/dashboard" 
                                className="text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon="arrow-left" className="mr-2" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                            {project.description && (
                                <p className="text-gray-600 mt-2">{project.description}</p>
                            )}
                        </div>
                        <Link
                            to={`/analyze?projectId=${projectId}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon="plus" />
                            New Recording
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                {recordings.length > 0 && (
                    <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('recordings')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                                activeTab === 'recordings'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FontAwesomeIcon icon="list" className="mr-2" />
                            Recordings
                        </button>
                        <button
                            onClick={() => setActiveTab('trends')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                                activeTab === 'trends'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FontAwesomeIcon icon="chart-line" className="mr-2" />
                            Trends
                        </button>
                    </div>
                )}

                {/* Content based on active tab */}
                {activeTab === 'trends' ? (
                    <TrendCharts recordings={recordings} />
                ) : (
                    <>
                        {/* Recordings List */}
                        {recordings.length === 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 shadow-sm text-center">
                        <div className="text-indigo-500 text-6xl mb-4">
                            <FontAwesomeIcon icon="microphone-slash" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No recordings yet</h3>
                        <p className="text-gray-600 mb-6">Create your first recording to get started.</p>
                        <Link
                            to={`/analyze?projectId=${projectId}`}
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition shadow-md"
                        >
                            <FontAwesomeIcon icon="microphone" className="mr-2" />
                            Create First Recording
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recordings.map((recording) => {
                            const date = formatDate(recording.createdAt);
                            const totalFillers = recording.filler_count 
                                ? Object.values(recording.filler_count).reduce((a, b) => a + b, 0)
                                : 0;
                            const scoreLabel = recording.rubric_total != null && recording.rubric_max != null
                                ? `${recording.rubric_total}/${recording.rubric_max}`
                                : '—';

                            return (
                                <div
                                    key={recording.id}
                                    className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setSelectedRecording(recording)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Draft {recordings.length - recordings.indexOf(recording)}
                                        </h3>
                                        <span className="text-xs text-gray-500">{date}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">WPM</p>
                                            <p className="text-xl font-bold text-indigo-700">{recording.wpm ?? '—'}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Fillers</p>
                                            <p className="text-xl font-bold text-indigo-700">{totalFillers}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Clarity</p>
                                            <p className="text-xl font-bold text-indigo-700">{recording.clarity_score ?? '—'}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-600">Rubric</p>
                                            <p className="text-xl font-bold text-indigo-700">{scoreLabel}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedRecording(recording);
                                            }}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRecording(recording);
                                            }}
                                            className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition"
                                            title="Delete recording"
                                        >
                                            <FontAwesomeIcon icon="trash" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                        )}
                    </>
                )}

                {/* Recording Detail Modal */}
                {selectedRecording && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedRecording(null)}
                    >
                        <div 
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                onClick={() => setSelectedRecording(null)}
                            >
                                <FontAwesomeIcon icon="times" />
                            </button>
                            <div className="overflow-y-auto max-h-[90vh] p-6">
                                {/* Import and use ResultPanel here if needed, or create a simplified view */}
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Recording Details</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-indigo-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-600 mb-1">WPM</p>
                                            <p className="text-2xl font-bold text-indigo-700">{selectedRecording.wpm ?? '—'}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-600 mb-1">Fillers</p>
                                            <p className="text-2xl font-bold text-indigo-700">
                                                {selectedRecording.filler_count 
                                                    ? Object.values(selectedRecording.filler_count).reduce((a, b) => a + b, 0)
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-600 mb-1">Clarity</p>
                                            <p className="text-2xl font-bold text-indigo-700">{selectedRecording.clarity_score ?? '—'}</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-600 mb-1">Rubric</p>
                                            <p className="text-2xl font-bold text-indigo-700">
                                                {selectedRecording.rubric_total != null && selectedRecording.rubric_max != null
                                                    ? `${selectedRecording.rubric_total}/${selectedRecording.rubric_max}`
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedRecording.transcript && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-800 mb-2">Transcript</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">{selectedRecording.transcript}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
