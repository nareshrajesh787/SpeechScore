import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function ResultPanel({ result }) {
    const filler_words = Object.keys(result.filler_count);
    const plain_transcript = result.transcript;

    const words = plain_transcript.split(" ");
    const highlighted_transcript = [];
    for (let i = 0; i < words.length; i++) {
        const word1 = words[i].toLowerCase().replace(/[^a-zA-Z]/g, "");
        const word2 =
            i + 1 < words.length &&
            words[i + 1].toLowerCase().replace(/[^a-zA-Z]/g, "");
        const pair = word2 && `${word1} ${word2}`;

        if (filler_words.includes(word1)) {
            highlighted_transcript.push(
                <span
                    key={i}
                    className="text-red-600 bg-red-100 rounded-md p-[0.1rem]"
                >
                    {words[i]}{" "}
                </span>
            );
        } else if (filler_words.includes(pair)) {
            highlighted_transcript.push(
                <span
                    key={i}
                    className="text-red-600 bg-red-100 rounded-md p-[0.1rem]"
                >
                    {words[i]} {words[i + 1]}{" "}
                </span>
            );
            i++;
        } else {
            highlighted_transcript.push(words[i] + " ");
        }
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 mt-12 shadow-lg space-y-6 font-medium">
            {/*TOP BAR*/}
            <div className="flex justify-between items-center text-sm text-gray-400">
                <p>
                    <FontAwesomeIcon icon={["far", "clock"]} className="me-1" />{" "}
                    Last analyzed: Just now
                </p>
                <div className="flex items-center gap-4">
                    <button className="text-indigo-600 font-medium bg-indigo-100 py-2 px-4 rounded-3xl hover:bg-indigo-200 transition-all">
                        <FontAwesomeIcon icon="rotate-right" className="me-1" />{" "}
                        Try Another
                    </button>
                    <button className="text-gray-500 bg-gray-100 rounded-2xl py-2 px-4 hover:bg-gray-200 transition-all">
                        <FontAwesomeIcon
                            icon={["far", "floppy-disk"]}
                            className="me-1"
                        />{" "}
                        Save
                    </button>
                </div>
            </div>

            {/*TRANSCRIPT*/}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm leading-relaxed">
                <h2 className="font-bold text-lg p-2 text-gray-800 mb">
                    <FontAwesomeIcon
                        icon="file-audio"
                        className="text-indigo-600 me-2"
                    />
                    Transcript
                </h2>
                <p className="mt-2 p-2 text-base text-gray-600">
                    {highlighted_transcript}
                </p>
            </div>

            {/*RESULT METRICS*/}
            <div className="bg-white rounded-xl shadow-sm border-gray-100 border p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
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
                            icon="magic-wand-sparkles"
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
            <div className="bg-white rounded-xl shadow-sm border-gray-100 border p-6">
                <p className="text-lg text-gray-700 font-bold mb-3">
                    <FontAwesomeIcon
                        icon="clipboard-list"
                        className="text-orange-400 me-1"
                    />{" "}
                    AI Generated Content Feedback
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FEEDBACK BLOCK */}
                    <div className="grid grid-rows-2 gap-4 pt-4 px-4">
                        {/* KEY STRENGTHS */}
                        <div className="flex-1">
                            <p className="text-green-600 text-lg font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="check-circle"
                                    className="me-2"
                                />
                                Key Strengths
                            </p>
                            <ul className="list-disc ml-5 text-md text-gray-700 space-y-2">
                                {result.ai_feedback.strengths.map(
                                    (point, i) => (
                                        <li key={i}>{point}</li>
                                    )
                                )}
                            </ul>
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
                            <ul className="list-disc ml-5 text-md text-gray-700 space-y-2">
                                {result.ai_feedback.improvements.map(
                                    (point, i) => (
                                        <li key={i}>{point}</li>
                                    )
                                )}
                            </ul>
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
                                {Object.entries(result.rubric_scores).map(
                                    ([key, value], i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center w-full"
                                        >
                                            <span>{key}</span>
                                            <span className="font-semibold text-gray-800">
                                                {value}/5
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* TOTAL SCORE */}
                            <div className="justify-between items-center flex mt-4">
                                <span className="font-semibold text-gray-500 text-sm">
                                    Total Score:{" "}
                                </span>
                                <span className="font-bold text-lg text-indigo-600 bg-indigo-100 py-[0.15rem] px-1 rounded-md">
                                    {result.rubric_total}/{result.rubric_max}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
