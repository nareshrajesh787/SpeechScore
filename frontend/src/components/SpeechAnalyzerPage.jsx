import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { db } from '../firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import ResultPanel from './ResultPanel';
import Navbar from './Navbar';
import AuthButton from './AuthButton.jsx';
import { Link } from 'react-router-dom';

export default function SpeechAnalyzerPage() {
    const [audioFile, setAudioFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [rubric, setRubric] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [user, loadingAuth] = useAuthState(auth);
    const navigate = useNavigate();

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

    const saveFeedback = async (result) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await addDoc(collection(db, 'feedback'), {
                uid: user.uid,
                ...result,
                timestamp: Timestamp.now(),
            });
            return true;
        } catch (error) {
            console.error('Error saving feedback:', error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (audioFile) {
            setIsLoading(true)
            try {
                const formData = new FormData();
                formData.append('audio_file', audioFile);
                formData.append('prompt', prompt);
                formData.append('rubric', rubric);
                if (!auth.currentUser) {
                    setIsLoading(false)
                    alert("You must be logged in to analyze speech.");
                    return;
                }
                const token = await auth.currentUser.getIdToken(true);
                const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
                const response = await fetch(`${apiUrl}/api/analyze`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
                if (!response.ok) {
                    const text = await response.text().catch(() => null);
                    throw new Error(`Server responded ${response.status}: ${text || response.statusText}`);
                }
                const data = await response.json()
                setResult(data)
            } catch (error) {
                console.error('Error during analysis:', error)
                alert("Failed to analyze: " + (error.message || error));
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
                        Upload your recording, provide your prompt and rubric
                        for personalized AI feedback. Receive instant,
                        actionable results.
                    </p>
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
                                required
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
                            <label
                                htmlFor="rubric"
                                className="text-sm font-bold"
                            >
                                Evaluation Rubric
                                <span className="text-amber-500">*</span>
                            </label>
                            <textarea
                                name="rubric"
                                value={rubric}
                                required
                                className="w-full mt-2 p-2 border rounded-xl bg-gray-50"
                                id="rubric"
                                rows="3"
                                placeholder="E.g. 'Content clarity, supporting evidence, engagement...' "
                                onChange={(e) => setRubric(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-7 mb-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-6 py-2 rounded-3xl font-semibold"
                        >
                            {isLoading ? (
                                "Analyzing..."
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
                </div>

                {result && <ResultPanel result={result} onSave={saveFeedback} onTryAgain={() => setResult(null)} />}
            </div>
        </div>
    );
}
