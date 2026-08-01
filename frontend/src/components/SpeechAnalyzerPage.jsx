import React, { useState, useEffect, useRef } from 'react';
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
import StudioMode from './StudioMode';
import AnalyzerForm from './AnalyzerForm';
import Card from './ui/Card';
import SignInGate from './ui/SignInGate';
import Spinner from './ui/Spinner';
import Tabs from './ui/Tabs';
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
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const navigate = useNavigate();

    const timeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const unsubscribeRef = useRef(null);

    // Analysis can be a background task that outlives a page navigation, so
    // make sure the timer/interval/listener from an in-flight run don't leak
    // if the user navigates away mid-analysis.
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

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
        return <Spinner size="lg" label="Loading..." fullScreen />;
    }

    if (!user) {
        return <SignInGate message="Sign in with Google to access your speech analysis and feedback features." />;
    }



    const handleStudioRecording = (file) => {
        setAudioFile(file);
        setAudioBlob(file); // Store the Blob for later upload
        setMode('upload'); // Switch back to upload view to show the file
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (audioFile) {
            // Clear any leftover timers/listener from a prior run before starting a new one.
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }

            setIsLoading(true);
            setError(null);
            setElapsedSeconds(0);
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
                
                // 3. Setup snapshot listener for completion, with an elapsed-time
                //    counter and a hard timeout so a stuck background task
                //    doesn't leave the UI spinning forever.
                intervalRef.current = setInterval(() => {
                    setElapsedSeconds((prev) => prev + 1);
                }, 1000);

                const ANALYSIS_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes
                const stopWaiting = () => {
                    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
                    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                };

                timeoutRef.current = setTimeout(() => {
                    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
                    stopWaiting();
                    setError("Analysis is taking longer than expected. This can happen with longer recordings, or something may have gone wrong on our end. Please try again.");
                    setIsLoading(false);
                }, ANALYSIS_TIMEOUT_MS);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.status === 'completed') {
                            stopWaiting();
                            setResult(data);
                            setIsLoading(false);
                            unsubscribe();
                            unsubscribeRef.current = null;
                        } else if (data.status === 'error') {
                            stopWaiting();
                            setError(data.error_message || "An error occurred during analysis.");
                            setIsLoading(false);
                            unsubscribe();
                            unsubscribeRef.current = null;
                        }
                    }
                }, (err) => {
                    stopWaiting();
                    console.error("Firestore listener error:", err);
                    setError("Failed to listen for analysis results.");
                    setIsLoading(false);
                    unsubscribeRef.current = null;
                });
                unsubscribeRef.current = unsubscribe;

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
                <Card variant="surface" padding="p-8" className="max-w-3xl mx-auto max-h-fit mt-12 shadow-lg">
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

                    {isLoading && (
                        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 flex items-start gap-3">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mt-1 flex-shrink-0"></div>
                            <div>
                                <p className="font-semibold text-sm">
                                    {isUploadingAudio ? 'Uploading your recording…' : 'Analyzing your speech…'}
                                </p>
                                <p className="text-sm opacity-90">
                                    {isUploadingAudio
                                        ? 'This should only take a few seconds.'
                                        : `This can take a minute or two for longer recordings. ${elapsedSeconds}s elapsed.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Mode Toggle */}
                    <Tabs
                        tabs={[
                            { id: 'upload', label: 'Upload File', icon: 'cloud-arrow-up' },
                            { id: 'studio', label: 'Studio Mode', icon: 'microphone' },
                        ]}
                        activeTab={mode}
                        onChange={setMode}
                        className="mb-5"
                    />

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
                </Card>

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
