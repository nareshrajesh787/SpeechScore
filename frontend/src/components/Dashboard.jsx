import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import { formatRelativeDate } from '../utils/formatDate';
import Navbar from './Navbar';
import ResultPanel from './ResultPanel';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import SignInGate from './ui/SignInGate';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptyState';
import RecordingCard from './RecordingCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

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
    const [formError, setFormError] = useState(null);

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
            setFormError('Please enter a project name');
            return;
        }

        try {
            const projectRef = await addDoc(collection(db, `users/${user.uid}/projects`), {
                name: newProjectName.trim(),
                description: newProjectDescription.trim() || '',
                rubricPreset: newProjectRubricPreset,
                createdAt: Timestamp.now(),
                uid: user.uid,
            });
            setShowNewProjectModal(false);
            setNewProjectName('');
            setNewProjectDescription('');
            setNewProjectRubricPreset('General Speaking');
            setFormError(null);
            navigate(`/project/${projectRef.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            setFormError('Failed to create project');
        }
    };

    const closeNewProjectModal = () => {
        setShowNewProjectModal(false);
        setFormError(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    if (loading) {
        return <Spinner size="lg" label="Loading your dashboard..." fullScreen />;
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
        return <SignInGate message="Sign in with Google to view your dashboard and saved analyses." />;
    }

    return (
        <div className="bg-zinc-50 min-h-screen">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.displayName}</h1>
                        <p className="text-gray-600 mt-1">Your projects and analyses</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-3"
                        >
                            <FontAwesomeIcon icon="plus" />
                            New Project
                        </Button>
                        <Button
                            as={Link}
                            to="/analyze"
                            variant="secondary"
                            className="px-6 py-3"
                        >
                            <FontAwesomeIcon icon="microphone" />
                            Quick Analyze
                        </Button>
                    </div>
                </div>

                {/* Projects Section */}
                {projects.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Projects</h2>
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {projects.map((project) => (
                                <motion.div key={project.id} variants={itemVariants}>
                                    <Card
                                        as={Link}
                                        to={`/project/${project.id}`}
                                        className="flex flex-col hover:border-indigo-200 p-6 h-full"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                            <FontAwesomeIcon icon="folder" className="text-indigo-500" />
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                                            <span>
                                                <FontAwesomeIcon icon="file-audio" className="mr-1" />
                                                {project.recordingCount || 0} recording{project.recordingCount !== 1 ? 's' : ''}
                                            </span>
                                            {project.createdAt && (
                                                <span title={project.createdAt.toDate ? project.createdAt.toDate().toLocaleString() : undefined}>
                                                    {project.createdAt.toDate ?
                                                        formatRelativeDate(project.createdAt.toDate()) :
                                                        'Recent'}
                                                </span>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Legacy Feedback Section */}
                {feedback.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800">Quick Analyses</h2>
                        <p className="text-sm text-gray-500 mt-1 mb-4">One-off analyses not attached to a project.</p>
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {feedback.map((fb) => (
                                <motion.div key={fb.id} variants={itemVariants}>
                                    <RecordingCard
                                        recording={fb}
                                        as="button"
                                        onClick={() => setSelected(fb)}
                                        className="bg-gradient-to-br from-white to-indigo-50/30 w-full text-left"
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                )}
                {projects.length === 0 && feedback.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        <EmptyState
                            icon="chart-line"
                            title="Get Started"
                            description="Create a project to organize your speech recordings, or do a quick analysis."
                            className="max-w-2xl mx-auto my-12"
                        >
                            <Button
                                variant="primary"
                                onClick={() => setShowNewProjectModal(true)}
                                className="px-6 py-3 rounded-full shadow-md"
                            >
                                <FontAwesomeIcon icon="folder-plus" />
                                Create Project
                            </Button>
                            <Button
                                as={Link}
                                to="/analyze"
                                variant="secondary"
                                className="px-6 py-3 rounded-full shadow-md"
                            >
                                <FontAwesomeIcon icon="microphone" />
                                Quick Analyze
                            </Button>
                        </EmptyState>
                    </motion.div>
                )}

                {/* New Project Modal */}
                <Modal
                    isOpen={showNewProjectModal}
                    onClose={closeNewProjectModal}
                    className="relative w-full max-w-md p-6"
                    labelledBy="new-project-heading"
                >
                    <h2 id="new-project-heading" className="text-2xl font-bold text-gray-900 mb-4">Create New Project</h2>
                    {formError && (
                        <p className="text-red-600 text-sm mb-4">{formError}</p>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="new-project-name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="new-project-name"
                                type="text"
                                value={newProjectName}
                                onChange={(e) => {
                                    setNewProjectName(e.target.value);
                                    if (formError) setFormError(null);
                                }}
                                placeholder="e.g., FBLA State Finals"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="new-project-description" className="block text-sm font-semibold text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                id="new-project-description"
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                placeholder="Brief description of this project..."
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-project-scenario" className="block text-sm font-semibold text-gray-700 mb-2">
                                Scenario <span className="text-gray-500 font-normal">(Optional)</span>
                            </label>
                            <select
                                id="new-project-scenario"
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
                            <Button
                                variant="primary"
                                onClick={handleCreateProject}
                                className="flex-1 px-6 py-3"
                            >
                                Create Project
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={closeNewProjectModal}
                                className="px-6 py-3"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                    {/* Rendered last so Modal's initial-focus lands on the Project Name
                        input rather than on the close affordance. */}
                    <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        aria-label="Close"
                        onClick={closeNewProjectModal}
                    >
                        <FontAwesomeIcon icon="times" />
                    </button>
                </Modal>

                <Modal
                    isOpen={!!selected}
                    onClose={() => setSelected(null)}
                    className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
                >
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
                        {selected && <ResultPanel result={selected} />}
                    </div>
                </Modal>
            </div>
        </div>
    );
}
