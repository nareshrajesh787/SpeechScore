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
import DeltaBadge from './ui/DeltaBadge';
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
    const [recordingPendingDelete, setRecordingPendingDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

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

    const handleDeleteRecording = (recording) => {
        setDeleteError(null);
        setRecordingPendingDelete(recording);
    };

    const confirmDeleteRecording = async () => {
        const recording = recordingPendingDelete;
        if (!recording) return;
        setRecordingPendingDelete(null);

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
            setDeleteError('Failed to delete recording. Please try again.');
        }
    };

    // Order matters here: `loadingData`'s fetch effect bails out early when
    // `!user` (see above) without ever calling setLoadingData(false), so a
    // signed-out visitor would be stuck on this spinner forever if `!user`
    // were checked after `loadingData` instead of before it.
    if (loading) {
        return <Spinner size="lg" label="Loading project..." fullScreen />;
    }

    if (!user) {
        return <SignInGate message="Sign in to view your projects." />;
    }

    if (loadingData) {
        return <Spinner size="lg" label="Loading project..." fullScreen />;
    }

    if (!project) {
        return (
            <div className="bg-paper-100 min-h-screen">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <p className="text-ink-600">Project not found</p>
                        <Link to="/dashboard" className="text-brand-600 hover:underline mt-4 inline-block">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-paper-100 min-h-screen">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Project Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <Link
                                to="/dashboard"
                                className="text-brand-600 hover:text-brand-700 mb-2 inline-flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon="arrow-left" className="mr-2" />
                                Back to Dashboard
                            </Link>
                            <h1 className="font-display text-4xl font-semibold text-ink-900">{project.name}</h1>
                            {project.description && (
                                <p className="text-ink-600 mt-2">{project.description}</p>
                            )}
                        </div>
                        <Button
                            as={Link}
                            to={`/analyze?projectId=${projectId}`}
                            variant="primary"
                            className="px-6 py-3 self-start"
                        >
                            <FontAwesomeIcon icon="plus" />
                            New Recording
                        </Button>
                    </div>
                </div>

                {deleteError && (
                    <div className="mb-6 p-4 bg-needs-work-50 border border-needs-work-200 rounded-xl text-needs-work-700 flex items-start gap-3">
                        <FontAwesomeIcon icon="circle-exclamation" className="mt-1 flex-shrink-0" />
                        <p className="text-sm">{deleteError}</p>
                    </div>
                )}

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
                        {/* Project Summary Strip -- only meaningful with at
                            least 2 drafts to compare. Recordings are
                            newest-first, so oldest = last element, newest =
                            first. */}
                        {recordings.length >= 2 && (() => {
                            const scored = recordings.filter(
                                (r) => Number.isFinite(r.rubric_total) && Number.isFinite(r.rubric_max) && r.rubric_max > 0
                            );
                            const best = scored.length
                                ? scored.reduce((a, b) => (b.rubric_total / b.rubric_max > a.rubric_total / a.rubric_max ? b : a))
                                : null;
                            const oldest = recordings[recordings.length - 1];
                            const newest = recordings[0];
                            const hasImprovementDelta = Number.isFinite(oldest?.rubric_total) && Number.isFinite(newest?.rubric_total);

                            return (
                                <div data-testid="project-summary-strip" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white border border-paper-300 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Drafts</p>
                                        <p className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{recordings.length}</p>
                                    </div>
                                    <div className="bg-white border border-paper-300 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Best score</p>
                                        <p className="font-display text-2xl font-semibold text-ink-900 tabular-nums">
                                            {best ? `${best.rubric_total}/${best.rubric_max}` : '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white border border-paper-300 rounded-xl p-4 col-span-2 sm:col-span-1">
                                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Since Draft 1</p>
                                        {hasImprovementDelta ? (
                                            <DeltaBadge current={newest.rubric_total} previous={oldest.rubric_total} className="text-sm" />
                                        ) : (
                                            <p className="font-display text-2xl font-semibold text-ink-400">—</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

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
                                {/* Recordings are fetched newest-first (orderBy createdAt desc),
                                    so draft numbering counts up from the oldest: draft 1 is the
                                    first attempt, draft N is the most recent. The chronologically
                                    previous draft for index i is index i+1 in this same order. */}
                                {recordings.map((recording, index) => (
                                    <RecordingCard
                                        key={recording.id}
                                        recording={recording}
                                        isDraft={!recording.name}
                                        draftNumber={recordings.length - index}
                                        previousRecording={recordings[index + 1] || null}
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
                                className="absolute top-4 right-4 z-10 text-paper-500 hover:text-ink-700 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                onClick={() => setSelectedRecording(null)}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon="times" />
                            </button>
                            <div className="overflow-y-auto max-h-[90vh]">
                                <ResultPanel
                                    result={selectedRecording}
                                    previousRecording={
                                        selectedRecording
                                            ? recordings[recordings.findIndex((r) => r.id === selectedRecording.id) + 1] || null
                                            : null
                                    }
                                />
                            </div>
                        </Modal>

                        {/* Delete Confirmation Modal */}
                        <Modal
                            isOpen={!!recordingPendingDelete}
                            onClose={() => setRecordingPendingDelete(null)}
                            className="p-8 flex flex-col gap-4 items-center max-w-md w-full"
                            labelledBy="delete-recording-heading"
                        >
                            <h3 id="delete-recording-heading" className="text-xl font-bold text-ink-800 text-center">
                                Delete Recording?
                            </h3>
                            <p className="text-paper-500 text-center">
                                Are you sure you want to delete this recording? This action cannot be undone.
                            </p>
                            <div className="flex flex-col gap-3 w-full">
                                <Button variant="danger" className="w-full justify-center" onClick={confirmDeleteRecording}>
                                    Delete Recording
                                </Button>
                                <Button variant="subtle" className="w-full justify-center" onClick={() => setRecordingPendingDelete(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </Modal>
                    </>
                )}
            </div>
        </div>
    );
}
