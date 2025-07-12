import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function ResultPanel({ result }) {
    const filler_words = Object.keys(result.filler_count)
    const plain_transcript = result.transcript

    const words = plain_transcript.split(' ')
    const highlighted_transcript = []
    for (let i = 0; i < words.length; i++) {
        const word1 = words[i].toLowerCase().replace(/[^a-zA-Z]/g, '');
        const word2 = i + 1 < words.length && words[i+1].toLowerCase().replace(/[^a-zA-Z]/g, '');
        const pair = word2 && `${word1} ${word2}`

        if (filler_words.includes(word1)) {
            highlighted_transcript.push(<span key={i} className="text-red-500">{words[i]} </span>)
        }

        else if (filler_words.includes(pair)) {
            highlighted_transcript.push(<span key={i} className="text-red-500">{words[i]} </span>)
            highlighted_transcript.push(<span key={i+1} className="text-red-500">{words[i+1]} </span>)
            i++
        }
        else {
            highlighted_transcript.push(words[i] + ' ')
        }
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 mt-12 shadow-lg space-y-6">
            <div className="flex justify-between items-center text-sm text-gray-500">
  <p>Last analyzed: Just now</p>
  <div className="flex items-center gap-4">
    <button className="text-indigo-600 font-medium hover:underline">Try Another</button>
    <button className="text-gray-400 hover:text-gray-600">
      <FontAwesomeIcon icon="floppy-disk" />
    </button>
  </div>
</div>
<div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm leading-relaxed">
  <h2 className="font-semibold text-gray-700 mb-2">
    <FontAwesomeIcon icon="file-lines" className="text-indigo-500 mr-2" />
    Transcript
  </h2>
  <p>{highlighted_transcript}</p>
</div>
<div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
  {/* WPM */}
  <div>
    <p className="text-sm text-gray-500">WPM</p>
    <p className="text-2xl font-bold text-gray-800">{result.wpm}</p>
    <p className="text-xs text-gray-400">Words/min</p>
  </div>

  {/* Filler Words */}
  <div>
    <p className="text-sm text-gray-500">Filler Words</p>
    <p className="text-2xl font-bold text-gray-800">
      {Object.values(result.filler_count).reduce((a, b) => a + b, 0)}
      <span className="text-sm text-gray-400 font-normal"> total</span>
    </p>
    <div className="text-xs text-gray-500 mt-1 space-x-3">
      {Object.entries(result.filler_count).map(([w, c], i) => (
        <span key={i}>
          <span className="font-medium">{w}</span> — {c}x
        </span>
      ))}
    </div>
  </div>

  {/* Clarity Score */}
  <div>
    <p className="text-sm text-gray-500">Clarity</p>
    <p className="text-2xl font-bold text-gray-800">{result.clarity_score}/10</p>
    <p className="text-xs text-green-600">{result.pace_feedback}</p>
  </div>
</div>
<div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
  <h2 className="font-semibold text-yellow-800 mb-2">
    <FontAwesomeIcon icon="lightbulb" className="mr-2" />
    AI-Generated Content Feedback
  </h2>

  <div className="flex flex-col md:flex-row gap-6">
    {/* Strengths */}
    <div className="flex-1">
      <p className="text-green-600 font-semibold mb-1">✅ Key Strengths</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        {result.ai_feedback.strengths.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>
    </div>

    {/* Improvements */}
    <div className="flex-1">
      <p className="text-orange-600 font-semibold mb-1">⚠️ Areas to Improve</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        {result.ai_feedback.improvements.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>
    </div>
  </div>
</div>
<div className="bg-white p-4 rounded-xl border border-gray-100">
  <h2 className="text-sm text-gray-500 font-semibold mb-2">Rubric Breakdown</h2>
  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-800">
    {Object.entries(result.rubric_scores).map(([key, value], i) => (
      <div key={i} className="flex justify-between">
        <span>{key}</span>
        <span className="font-semibold">{value}/5</span>
      </div>
    ))}
  </div>
  <p className="text-right mt-4 font-bold text-indigo-600">
    Total Score: {result.rubric_total}/{result.rubric_max}
  </p>
</div>


        </div>
    )
}
