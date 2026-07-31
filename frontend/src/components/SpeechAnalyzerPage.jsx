import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { db } from '../firebase';
import { addDoc, collection, Timestamp, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { uploadAudioToStorage } from '../utils/audioStorage';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import ResultPanel from './ResultPanel';
import Navbar from './Navbar';
import AuthButton from './AuthButton.jsx';
import StudioMode from './StudioMode';
import AnalyzerForm from './AnalyzerForm';
import { Link } from 'react-router-dom';

import { API_URL } from '../config';

export default function SpeechAnalyzerPage() {
    const [audioFile, setAudioFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [rubric, setRubric] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [result, setResult] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null); // Store audio Blob for upload
    const [user, loadingAuth] = useAuthState(auth);
    const [mode, setMode] = useState('upload'); // 'upload' or 'studio'
    const [searchParams] = useSearchParams();
    const [projectId, setProjectId] = useState(null);
    const [presetName, setPresetName] = useState(null);
    const [selectedScenario, setSelectedScenario] = useState('General Speaking');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const pid = searchParams.get('projectId');
        if (pid) {
            setProjectId(pid);
            // Fetch project to get rubric preset
            const fetchProject = async () => {
                if (!auth.currentUser) return;
                try {
                    const projectRef = doc(db, `users/${auth.currentUser.uid}/projects/${pid}`);
                    const projectSnap = await getDoc(projectRef);
                    if (projectSnap.exists()) {
                        const projectData = projectSnap.data();
                        if (projectData.rubricPreset && RUBRIC_PRESETS[projectData.rubricPreset]) {
                            setRubric(RUBRIC_PRESETS[projectData.rubricPreset]);
                            setPresetName(projectData.rubricPreset);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching project:', error);
                }
            };
            fetchProject();
        }
    }, [searchParams, auth.currentUser]);

    // Initial load for Quick Analysis (no project)
    useEffect(() => {
        if (!projectId && !rubric) {
            setRubric(RUBRIC_PRESETS['General Speaking']);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Handle Quick Analysis Scenario Change
    const handleScenarioChange = (e) => {
        const newScenario = e.target.value;
        setSelectedScenario(newScenario);
        if (RUBRIC_PRESETS[newScenario] !== undefined) {
            setRubric(RUBRIC_PRESETS[newScenario]);
            // Clear preset badge name since we have a dropdown now
            setPresetName(null);
        }
    };

    // Handle Manual Rubric Edits
    const handleRubricChange = (e) => {
        const newValue = e.target.value;
        setRubric(newValue);

        // Quick Mode: Switch dropdown to Custom if user edits text
        if (!projectId && selectedScenario !== 'Custom') {
            setSelectedScenario('Custom');
        }

        // Project Mode: Hide badge if text deviates from preset
        if (projectId && presetName && RUBRIC_PRESETS[presetName] !== newValue) {
            setPresetName(null);
        }
    };

    if (loadingAuth) {
        return (
            <div className="bg-zinc-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
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
                    <p className="text-gray-500 text-center mb-3">Sign in with Google to access your speech analysis and feedback features.</p>
                    <div className="flex flex-col items-center w-full gap-2">
                        <AuthButton />
                    </div>
                </div>
            </div>
        );
    }



    const handleStudioRecording = (file) => {
        setAudioFile(file);
        setAudioBlob(file); // Store the Blob for later upload
        setMode('upload'); // Switch back to upload view to show the file
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (audioFile) {
            setIsLoading(true);
            setError(null);
            setIsUploadingAudio(true);

            try {
                if (!auth.currentUser) {
                    setIsLoading(false);
                    setIsUploadingAudio(false);
                    setError("You must be logged in to analyze speech.");
                    return;
                }

                // 1. Upload audio to Firebase Storage FIRST
                const audioBlobToUpload = audioFile;
                setAudioBlob(audioBlobToUpload);

                let audioUrl = null;
                const tempRecordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                try {
                    audioUrl = await uploadAudioToStorage(
                        audioBlobToUpload,
                        auth.currentUser.uid,
                        projectId || null,
                        tempRecordingId
                    );
                } catch (uploadError) {
                    console.error('Error uploading audio to storage:', uploadError);
                    throw new Error("Failed to upload audio to cloud storage.");
                }
                setIsUploadingAudio(false); // Done uploading

                // Create dummy document with status analyzing
                let docRef;
                const initialData = {
                    status: 'analyzing',
                    audioUrl: audioUrl,
                    prompt: prompt,
                    rubric: rubric,
                    createdAt: Timestamp.now(),
                    timestamp: Timestamp.now(),
                    uid: auth.currentUser.uid,
                };
                
                if (projectId) {
                    docRef = doc(db, `users/${auth.currentUser.uid}/projects/${projectId}/recordings/${tempRecordingId}`);
                } else {
                    docRef = doc(db, `feedback/${tempRecordingId}`);
                }
                await setDoc(docRef, initialData);

                // 2. Send JSON request with the URL to FastAPI backend
                const token = await auth.currentUser.getIdToken(true);
                const payload = {
                    audio_url: audioUrl,
                    prompt: prompt,
                    rubric: rubric,
                    recording_id: tempRecordingId,
                    project_id: projectId || null,
                };

                const response = await fetch(`${API_URL}/api/analyze`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ detail: response.statusText, status: response.status }));
                    const msg = errData.detail || `Server error: ${response.status}`;
                    throw new Error(msg);
                }
                
                // 3. Setup snapshot listener for completion
                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.status === 'completed') {
                            setResult(data);
                            setIsLoading(false);
                            unsubscribe();
                        } else if (data.status === 'error') {
                            setError(data.error_message || "An error occurred during analysis.");
                            setIsLoading(false);
                            unsubscribe();
                        }
                    }
                }, (err) => {
                    console.error("Firestore listener error:", err);
                    setError("Failed to listen for analysis results.");
                    setIsLoading(false);
                });

            } catch (error) {
                console.error('Error during analysis:', error);
                setError(error.message || "An unexpected error occurred. Please try again.");
                setIsLoading(false);
                setIsUploadingAudio(false);
            }
        }
    }

    return (
        <div className="bg-zinc-50 min-h-screen">
            <Navbar />
            <div
                className={
                    result
                        ? "p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                        : "p-6 grid grid-cols-1"
                }
            >
                <div className="max-w-3xl mx-auto max-h-fit bg-gradient-to-br from-white to-indigo-50/20 rounded-2xl p-8 mt-12 shadow-lg border border-indigo-100">
                    <h1 className="font-bold text-4xl text-center text-gray-800">
                        <FontAwesomeIcon
                            className="text-indigo-600"
                            icon={"bolt"}
                        />{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700">
                            Analyze Your{" "}

                            Speech
                        </span>
                    </h1>
                    <p className="text-center font-medium text-gray-500 px-5 mt-4 mb-5">
                        {mode === 'upload'
                            ? 'Upload your recording or record directly in the browser. Provide your prompt and rubric for personalized AI feedback.'
                            : 'Record your speech directly in the browser with Studio Mode. Pause, resume, and see real-time waveform visualization.'}
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
                            <FontAwesomeIcon icon="circle-exclamation" className="mt-1 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Analysis Failed</p>
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMode('upload')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${mode === 'upload'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FontAwesomeIcon icon="cloud-arrow-up" className="mr-2" />
                            Upload File
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('studio')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${mode === 'studio'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FontAwesomeIcon icon="microphone" className="mr-2" />
                            Studio Mode
                        </button>
                    </div>

                    {mode === 'studio' ? (
                        <StudioMode
                            onRecordingComplete={handleStudioRecording}
                            onCancel={() => setMode('upload')}
                        />
                    ) : (
                        <AnalyzerForm
                            audioFile={audioFile}
                            setAudioFile={setAudioFile}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            rubric={rubric}
                            projectId={projectId}
                            selectedScenario={selectedScenario}
                            handleScenarioChange={handleScenarioChange}
                            presetName={presetName}
                            handleRubricChange={handleRubricChange}
                            isLoading={isLoading}
                            isUploadingAudio={isUploadingAudio}
                            handleSubmit={handleSubmit}
                        />
                    )}
                </div>

                {result && (
                    <ResultPanel
                        result={result}
                        onTryAgain={() => {
                            setResult(null);
                            setAudioBlob(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
