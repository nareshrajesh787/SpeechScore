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
import ResultPanel from './ResultPanel';
import TrendCharts from './charts/TrendCharts';
import RecordingCard from './RecordingCard';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import Modal from './ui/Modal';
import SignInGate from './ui/SignInGate';
import Spinner from './ui/Spinner';
import Tabs from './ui/Tabs';

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

    if (loading || loadingData) {
        return <Spinner size="lg" label="Loading project..." fullScreen />;
    }

    if (!user) {
        return <SignInGate message="Sign in to view your projects." />;
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
                        <Button
                            as={Link}
                            to={`/analyze?projectId=${projectId}`}
                            variant="primary"
                            className="px-6 py-3"
                        >
                            <FontAwesomeIcon icon="plus" />
                            New Recording
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                {recordings.length > 0 && (
                    <Tabs
                        tabs={[
                            { id: 'recordings', label: 'Recordings', icon: 'list' },
                            { id: 'trends', label: 'Trends', icon: 'chart-line' }
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="mb-6"
                    />
                )}

                {/* Content based on active tab */}
                {activeTab === 'trends' ? (
                    <TrendCharts recordings={recordings} />
                ) : (
                    <>
                        {/* Recordings List */}
                        {recordings.length === 0 ? (
                            <EmptyState
                                icon="microphone-slash"
                                title="No recordings yet"
                                description="Create your first recording to get started."
                            >
                                <Button
                                    as={Link}
                                    to={`/analyze?projectId=${projectId}`}
                                    variant="primary"
                                    className="px-6 py-3 rounded-full"
                                >
                                    <FontAwesomeIcon icon="microphone" />
                                    Create First Recording
                                </Button>
                            </EmptyState>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {recordings.map((recording) => (
                                    <RecordingCard
                                        key={recording.id}
                                        recording={recording}
                                        onClick={() => setSelectedRecording(recording)}
                                        onDelete={handleDeleteRecording}
                                        showDelete={true}
                                        className="cursor-pointer bg-white shadow-sm hover:shadow-md transition-all"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Recording Detail Modal */}
                        <Modal
                            isOpen={!!selectedRecording}
                            onClose={() => setSelectedRecording(null)}
                            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
                        >
                            <button
                                className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                onClick={() => setSelectedRecording(null)}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon="times" />
                            </button>
                            <div className="overflow-y-auto max-h-[90vh]">
                                <ResultPanel result={selectedRecording} />
                            </div>
                        </Modal>
                    </>
                )}
            </div>
        </div>
    );
}
