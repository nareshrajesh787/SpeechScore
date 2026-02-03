import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { db } from '../firebase';
import { addDoc, collection, Timestamp, doc, getDoc } from 'firebase/firestore';
import { uploadAudioToStorage } from '../utils/audioStorage';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import ResultPanel from './ResultPanel';
import Navbar from './Navbar';
import AuthButton from './AuthButton.jsx';
import StudioMode from './StudioMode';
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

    const saveFeedback = async (resultWithAudioUrl) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // If audioUrl is not yet set but we have audioBlob, upload it first
            let finalResult = { ...resultWithAudioUrl };
            if (!finalResult.audioUrl && audioBlob) {
                try {
                    // Generate a temporary ID for the upload
                    const tempRecordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const audioUrl = await uploadAudioToStorage(
                        audioBlob,
                        user.uid,
                        projectId || null,
                        tempRecordingId
                    );
                    finalResult.audioUrl = audioUrl;
                } catch (uploadError) {
                    console.error('Error uploading audio during save:', uploadError);
                    // Continue without audioUrl
                }
            }

            let recordingRef;
            if (projectId) {
                // Save to project/recordings structure
                recordingRef = await addDoc(collection(db, `users/${user.uid}/projects/${projectId}/recordings`), {
                    ...finalResult,
                    createdAt: Timestamp.now(),
                });
            } else {
                // Fallback to old structure for backward compatibility
                recordingRef = await addDoc(collection(db, 'feedback'), {
                    uid: user.uid,
                    ...finalResult,
                    timestamp: Timestamp.now(),
                });
            }

            // Update the result with the recording ID if needed
            // (The audio was already uploaded with a generated ID, which is fine)

            return true;
        } catch (error) {
            console.error('Error saving feedback:', error);
            return false;
        }
    };

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

            try {
                // Store audio Blob for later upload to Firebase Storage
                const audioBlobToUpload = audioFile instanceof File ? audioFile : audioFile;
                setAudioBlob(audioBlobToUpload);

                const formData = new FormData();
                formData.append('audio_file', audioFile);
                formData.append('prompt', prompt);
                formData.append('rubric', rubric);
                if (!auth.currentUser) {
                    setIsLoading(false)
                    setError("You must be logged in to analyze speech.");
                    return;
                }
                const token = await auth.currentUser.getIdToken(true);

                const response = await fetch(`${API_URL}/api/analyze`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ detail: response.statusText, status: response.status }));
                    const msg = errData.detail || `Server error: ${response.status}`;
                    throw new Error(msg);
                }
                const data = await response.json()

                // Upload audio to Firebase Storage after successful analysis
                if (audioBlobToUpload && auth.currentUser) {
                    setIsUploadingAudio(true);
                    try {
                        const audioUrl = await uploadAudioToStorage(
                            audioBlobToUpload,
                            auth.currentUser.uid,
                            projectId || null,
                            null // recordingId will be generated
                        );
                        // Add audioUrl to the result
                        data.audioUrl = audioUrl;
                    } catch (uploadError) {
                        console.error('Error uploading audio to storage:', uploadError);
                        // Don't block the user - continue without audioUrl
                        // They can still see the analysis results
                    } finally {
                        setIsUploadingAudio(false);
                    }
                }

                setResult(data)
            } catch (error) {
                console.error('Error during analysis:', error)
                setError(error.message || "An unexpected error occurred. Please try again.");
            } finally {
                setIsLoading(false)
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
                        <form onSubmit={handleSubmit}>
                            <label
                                htmlFor="audioFile"
                                className="text-sm font-bold"
                            >
                                Audio File<span className="text-amber-500">*</span>
                            </label>
                            <div className="border-indigo-300 group border-2 border-dashed rounded-xl p-6 mt-2 text-gray-500 text-center hover:bg-indigo-50 cursor-pointer">
                                <input
                                    type="file"
                                    id="audio-upload"
                                    name="audioFile"
                                    accept="audio/*"
                                    required={!audioFile}
                                    style={{ display: "none" }}
                                    onChange={(e) =>
                                        setAudioFile(e.target.files[0])
                                    }
                                />
                                <label
                                    htmlFor="audio-upload"
                                    className="block cursor-pointer text-indigo-600 font-semibold mt-2"
                                >
                                    <FontAwesomeIcon
                                        icon={"cloud-arrow-up"}
                                        className="text-indigo-500 text-5xl mb-4 group-hover:scale-[1.2] transition-transform duration-300"
                                    />
                                    <p className="text-sm text-gray-700 font-medium">
                                        {audioFile
                                            ? audioFile.name
                                            : "Click or drag to upload .mp3, .wav"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Max 20MB
                                    </p>
                                </label>
                            </div>
                            <div className="mt-5">
                                <label
                                    htmlFor="prompt"
                                    className="text-sm font-bold"
                                >
                                    Speech Prompt
                                    <span className="text-amber-500">*</span>
                                </label>
                                <textarea
                                    name="prompt"
                                    value={prompt}
                                    required
                                    className="w-full mt-2 p-2 border rounded-xl bg-gray-50 font-[400]"
                                    id="prompt"
                                    rows="3"
                                    placeholder="E.g. 'Describe a challenge you overcame' or paste your assignment question"
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>
                            <div className="mt-5">
                                {!projectId && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-bold mb-2">
                                            Scenario / Preset
                                        </label>
                                        <select
                                            value={selectedScenario}
                                            onChange={handleScenarioChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {Object.keys(RUBRIC_PRESETS).map((key) => (
                                                <option key={key} value={key}>
                                                    {key}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <label
                                    htmlFor="rubric"
                                    className="text-sm font-bold"
                                >
                                    Evaluation Rubric
                                    <span className="text-amber-500">*</span>
                                    {presetName && presetName !== 'Custom' && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                            Using "{presetName}" preset
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    name="rubric"
                                    value={rubric}
                                    required
                                    className="w-full mt-2 p-2 border rounded-xl bg-gray-50"
                                    id="rubric"
                                    rows="3"
                                    placeholder="E.g. 'Content clarity, supporting evidence, engagement...' "
                                    onChange={handleRubricChange}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!audioFile || isLoading || isUploadingAudio}
                                className="mt-7 mb-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-center px-6 py-2 rounded-3xl font-semibold"
                            >
                                {isLoading ? (
                                    "Analyzing..."
                                ) : isUploadingAudio ? (
                                    "Uploading Audio..."
                                ) : (
                                    <>
                                        Analyze Speech{" "}
                                        <FontAwesomeIcon
                                            className="mr-2"
                                            icon="arrow-right"
                                        />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {result && (
                    <ResultPanel
                        result={result}
                        onSave={saveFeedback}
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
