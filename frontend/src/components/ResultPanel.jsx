import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import InteractiveTranscript from "./InteractiveTranscript";
import CoachChat from "./CoachChat";

export default function ResultPanel({ result, onSave, onTryAgain }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [filter, setFilter] = useState('all'); // 'all', 'fillers', 'pace', 'clarity'
    const [activeTab, setActiveTab] = useState('transcript'); // 'transcript', 'coach'

    if (!result) {
        return (
            <div className="bg-white rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        if (!onSave || isSaved) return;
        setIsSaving(true);
        try {
            const success = await onSave(result);
            if (success) setIsSaved(true);
            else alert("Failed to save feedback. Please try again.");
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save feedback. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTryAgain = () => {
        if (onTryAgain) onTryAgain();
    };

    const getFilteredFeedback = () => {
        if (filter === 'all') return result;

        const filtered = { ...result };

        if (filter === 'fillers') {
            // Show only filler word related feedback
            return {
                ...filtered,
                ai_feedback: {
                    strengths: filtered.ai_feedback.strengths.filter(s =>
                        s.toLowerCase().includes('filler') ||
                        s.toLowerCase().includes('um') ||
                        s.toLowerCase().includes('uh')
                    ),
                    improvements: filtered.ai_feedback.improvements.filter(i =>
                        i.toLowerCase().includes('filler') ||
                        i.toLowerCase().includes('um') ||
                        i.toLowerCase().includes('uh')
                    )
                }
            };
        }

        if (filter === 'pace') {
            // Show only pace related feedback
            return {
                ...filtered,
                ai_feedback: {
                    strengths: filtered.ai_feedback.strengths.filter(s =>
                        s.toLowerCase().includes('pace') ||
                        s.toLowerCase().includes('speed') ||
                        s.toLowerCase().includes('rate')
                    ),
                    improvements: filtered.ai_feedback.improvements.filter(i =>
                        i.toLowerCase().includes('pace') ||
                        i.toLowerCase().includes('speed') ||
                        i.toLowerCase().includes('rate') ||
                        i.toLowerCase().includes('slow') ||
                        i.toLowerCase().includes('fast')
                    )
                }
            };
        }

        if (filter === 'clarity') {
            // Show only clarity related feedback
            return {
                ...filtered,
                ai_feedback: {
                    strengths: filtered.ai_feedback.strengths.filter(s =>
                        s.toLowerCase().includes('clear') ||
                        s.toLowerCase().includes('articulate') ||
                        s.toLowerCase().includes('pronunciation')
                    ),
                    improvements: filtered.ai_feedback.improvements.filter(i =>
                        i.toLowerCase().includes('clear') ||
                        i.toLowerCase().includes('articulate') ||
                        i.toLowerCase().includes('pronunciation') ||
                        i.toLowerCase().includes('enunciate')
                    )
                }
            };
        }

        return filtered;
    };

    const filteredResult = getFilteredFeedback();

    return (
        <div className="bg-gradient-to-br from-white to-indigo-50/20 rounded-2xl p-8 space-y-6 font-medium border border-indigo-100">
            {/*TOP BAR*/}
            <div className="flex justify-between items-center text-sm text-gray-400">
                <p>
                    <FontAwesomeIcon icon={["far", "clock"]} className="me-1" />{" "}
                    Last analyzed: Just now
                </p>
                <div className="flex items-center gap-4">
                    {onTryAgain && (
                        <button
                            onClick={handleTryAgain}
                            className="text-indigo-600 font-medium bg-indigo-100 py-2 px-4 rounded-3xl hover:bg-indigo-200 transition-all"
                        >
                            <FontAwesomeIcon icon="rotate-right" className="me-1" />{" "}
                            Try Another
                        </button>
                    )}
                    {onSave && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isSaved}
                            className={`rounded-2xl py-2 px-4 transition-all ${isSaved
                                ? "text-green-600 bg-green-100 cursor-default"
                                : isSaving
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            <FontAwesomeIcon
                                icon={isSaved ? "check" : ["far", "floppy-disk"]}
                                className="me-1"
                            />{" "}
                            {isSaved ? "Saved!" : isSaving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>

            {/*FILTER DROPDOWN*/}
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-800">
                    <FontAwesomeIcon icon="filter" className="text-indigo-600 mr-2" />
                    Filter Analysis
                </h2>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">All Feedback</option>
                    <option value="fillers">Filler Words</option>
                    <option value="pace">Pace & Speed</option>
                    <option value="clarity">Clarity & Pronunciation</option>
                </select>
            </div>

            {/* TABBED CONTENT AREA */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-4">
                <button
                    onClick={() => setActiveTab('transcript')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'transcript'
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <FontAwesomeIcon icon="file-lines" className="mr-2" />
                    Transcript
                </button>
                <button
                    onClick={() => setActiveTab('coach')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'coach'
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <FontAwesomeIcon icon="chalkboard-user" className="mr-2" />
                    Ask Coach
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'transcript' ? (
                <InteractiveTranscript
                    transcript={result.transcript}
                    wordTimestamps={result.words}
                    fillerCount={result.filler_count}
                    audioUrl={result.audioUrl}
                    audioDuration={result.audio_duration}
                />
            ) : (
                <CoachChat
                    transcript={result.transcript}
                    rubricFeedback={result}
                />
            )}

            {/*RESULT METRICS*/}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-sm border-indigo-100 border p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {/* WPM */}
                <div>
                    <p className="text-lg text-gray-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="gauge"
                            className="text-indigo-600 me-1"
                        />{" "}
                        WPM
                    </p>
                    <div className="flex items-baseline justify-start gap-2">
                        <p className="text-2xl font-bold text-gray-800">
                            {result.wpm}
                        </p>
                        <p className="text-xs text-gray-400">Words/min</p>
                    </div>
                    <div className="w-full h-2 bg-indigo-100 rounded-full mt-2 relative overflow-hidden">
                        <div
                            className="h-2 bg-indigo-600 rounded-full"
                            style={{
                                width: `${Math.min(
                                    (result.wpm / 200) * 100,
                                    100
                                )}%`,
                            }}
                        ></div>
                    </div>
                </div>

                {/* FILLER WORDS */}
                <div>
                    <p className="text-lg text-gray-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="wand-magic-sparkles"
                            className="text-orange-400 me-1"
                        />{" "}
                        Filler Words
                    </p>
                    <div className="flex items-baseline justify-start gap-2">
                        <p className="text-2xl font-bold text-gray-800">
                            {Object.values(result.filler_count).reduce(
                                (a, b) => a + b,
                                0
                            )}
                        </p>
                        <p className="text-xs text-gray-400">total</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 mb-2 flex justify-start gap-2 flex-wrap">
                        {Object.entries(result.filler_count).map(
                            ([w, c], i) => (
                                <span key={i} className="font-bold">
                                    <span className="text-red-600 font-semibold bg-red-100 rounded-md p-[0.1rem] my-1">
                                        {w}
                                    </span>{" "}
                                    — {c}x
                                </span>
                            )
                        )}
                    </div>
                </div>

                {/* CLARITY */}
                <div>
                    <p className="text-lg text-gray-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="star"
                            className="text-green-500 me-1"
                        />{" "}
                        Clarity
                    </p>
                    <div className="flex justify-start items-center flex-wrap gap-2 mb-3">
                        <p className="text-2xl font-bold text-gray-800">
                            {result.clarity_score}
                        </p>
                        <p className="text-xs text-gray-400 me-2">/10</p>
                        <div className="flex text-lg items-center">
                            {[...Array(5)].map((_, i) => (
                                <FontAwesomeIcon
                                    key={i}
                                    icon="star"
                                    className={
                                        i < Math.round(result.clarity_score / 2)
                                            ? "text-yellow-400"
                                            : "text-gray-200"
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-start gap-2">
                        <FontAwesomeIcon
                            icon="comment-dots"
                            className="text-indigo-400"
                        />{" "}
                        <p className="text-xs text-gray-500">
                            {result.pace_feedback}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI FEEDBACK AND RUBRIC */}
            <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-xl shadow-sm border-purple-100 border p-6">
                <p className="text-lg text-gray-700 font-bold mb-3">
                    <FontAwesomeIcon
                        icon="clipboard-list"
                        className="text-orange-400 me-1"
                    />{" "}
                    AI Generated Content Feedback
                    {filter !== 'all' && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            (Filtered: {filter})
                        </span>
                    )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FEEDBACK BLOCK */}
                    <div className="grid grid-rows-2 gap-4 pt-4 px-4">
                        {/* KEY STRENGTHS */}
                        <div className="flex-1">
                            <p className="text-green-600 text-lg font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="circle-check"
                                    className="me-2"
                                />
                                Key Strengths
                            </p>
                            {filteredResult.ai_feedback.strengths.length > 0 ? (
                                <ul className="list-disc ml-5 text-md text-gray-700 space-y-2">
                                    {filteredResult.ai_feedback.strengths.map(
                                        (point, i) => (
                                            <li key={i}>{point}</li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm italic">No strengths found for this filter.</p>
                            )}
                        </div>

                        {/* AREAS TO IMPROVE */}
                        <div className="flex-1">
                            <p className="text-orange-500 text-lg font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="triangle-exclamation"
                                    className="me-2"
                                />
                                Areas to Improve
                            </p>
                            {filteredResult.ai_feedback.improvements.length > 0 ? (
                                <ul className="list-disc ml-5 text-md text-gray-700 space-y-2">
                                    {filteredResult.ai_feedback.improvements.map(
                                        (point, i) => (
                                            <li key={i}>{point}</li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm italic">No improvements found for this filter.</p>
                            )}
                        </div>
                    </div>

                    {/* RUBRIC BREAKDOWN */}
                    <div>
                        <div className="bg-yellow-50 p-4 rounded-xl border-yellow-100 border shadow-md">
                            <p className="text-lg text-gray-700 font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="chart-simple"
                                    className="text-yellow-400 me-1"
                                />{" "}
                                Rubric Breakdown
                            </p>

                            {/* RUBRIC SCORES */}
                            <div className="grid gap-y-2 items-center text-md text-gray-700">
                                {Object.entries(filteredResult.rubric_scores).map(
                                    ([key, value], i) => {
                                        let score, max;
                                        if (typeof value === 'object' && value !== null && 'score' in value) {
                                            score = value.score;
                                            max = value.max_score;
                                        } else {
                                            // Legacy format support
                                            score = value;
                                            max = 5; // Fallback
                                        }

                                        return (
                                            <div
                                                key={i}
                                                className="flex justify-between items-center w-full"
                                            >
                                                <span>{key}</span>
                                                <span className="font-semibold text-gray-800">
                                                    {score}/{max}
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            {/* TOTAL SCORE */}
                            <div className="justify-between items-center flex mt-4">
                                <span className="font-semibold text-gray-500 text-sm">
                                    Total Score:{" "}
                                </span>
                                <span className="font-bold text-lg text-indigo-600 bg-indigo-100 py-[0.15rem] px-1 rounded-md">
                                    {filteredResult.rubric_total}/{filteredResult.rubric_max}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
