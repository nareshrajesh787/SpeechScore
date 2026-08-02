import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { motion } from 'framer-motion';

import InteractiveTranscript from "./InteractiveTranscript";
import CoachChat from "./CoachChat";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Spinner from "./ui/Spinner";
import Tabs from "./ui/Tabs";
import DeltaBadge from "./ui/DeltaBadge";
import { getMetricTone } from "./ui/Metric";
import { getRubricScoreEntries } from "../utils/normalizeRecording";

// Static tone -> class maps. Tailwind's JIT scanner needs literal class
// strings in source; a template like `text-${tone}-700` would silently
// produce no CSS at build time.
const TONE_TEXT = {
    good: 'text-good-700',
    caution: 'text-caution-700',
    'needs-work': 'text-needs-work-700',
    neutral: 'text-ink-800',
};
const TONE_BAR = {
    good: 'bg-good-500',
    caution: 'bg-caution-500',
    'needs-work': 'bg-needs-work-500',
    neutral: 'bg-paper-400',
};
const TONE_HEADLINE = {
    good: 'text-good-600',
    caution: 'text-caution-600',
    'needs-work': 'text-needs-work-600',
    neutral: 'text-ink-500',
};
const GRADE_LABEL = {
    good: 'Strong performance',
    caution: 'Solid, with room to grow',
    'needs-work': 'Needs work',
    neutral: 'Not yet scored',
};

export default function ResultPanel({ result, previousRecording, onTryAgain }) {
    const [activeTab, setActiveTab] = useState('transcript'); // 'transcript', 'coach'

    if (!result) {
        return (
            <Spinner
                size="sm"
                label="Loading results..."
                className="bg-white rounded-2xl p-8 min-h-[200px]"
            />
        );
    }

    const handleTryAgain = () => {
        if (onTryAgain) onTryAgain();
    };

    const getLastAnalyzedLabel = () => {
        const date = result.createdAt?.toDate ? result.createdAt.toDate() :
            (result.timestamp?.toDate ? result.timestamp.toDate() : null);
        return date ? date.toLocaleString() : "Just now";
    };

    const hasRubricTotal = Number.isFinite(result.rubric_total) && Number.isFinite(result.rubric_max) && result.rubric_max > 0;
    const scoreTone = hasRubricTotal ? getMetricTone('rubric', result.rubric_total, { max: result.rubric_max }) : 'neutral';

    const totalFillers = result.filler_count
        ? Object.values(result.filler_count).reduce((a, b) => a + b, 0)
        : 0;
    const wpmTone = getMetricTone('wpm', result.wpm);
    const fillersTone = getMetricTone('fillers', totalFillers, { durationSeconds: result.audio_duration });
    const clarityTone = getMetricTone('clarity', result.clarity_score);

    // WPM deliberately gets no DeltaBadge: "better" for pace means "closer to
    // the 130-150 ideal band," not "higher" or "lower." A signed delta chip
    // would misreport direction-of-improvement for anyone above the band
    // (e.g. 165 -> 145 is an improvement despite being a negative delta shown
    // as "worse" by a naive higher-is-better read). Fillers/clarity/rubric are
    // all genuinely monotonic (fewer fillers, higher clarity, higher score is
    // always better), so those get real delta badges.
    const hasPrevious = Boolean(previousRecording);
    const previousFillers = hasPrevious && previousRecording.filler_count
        ? Object.values(previousRecording.filler_count).reduce((a, b) => a + b, 0)
        : null;

    return (
        <Card
            as={motion.div}
            variant="surface"
            padding="p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-6 font-medium"
        >
            {/*TOP BAR*/}
            <div className="flex justify-between items-center text-sm text-paper-500">
                <p>
                    <FontAwesomeIcon icon={["far", "clock"]} className="me-1" />{" "}
                    Last analyzed: {getLastAnalyzedLabel()}
                </p>
                <div className="flex items-center gap-4">
                    {onTryAgain && (
                        <Button
                            variant="ghost"
                            onClick={handleTryAgain}
                            className="bg-brand-100 hover:bg-brand-200 rounded-3xl"
                        >
                            <FontAwesomeIcon icon="rotate-right" />
                            Try Another
                        </Button>
                    )}
                </div>
            </div>

            {/* SCORE HERO -- the number the user actually came here for, given
                the visual weight to match. Previously this was a small text-lg
                figure buried at the bottom of a bordered box below the AI
                feedback section. */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-paper-300">
                <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">
                        Overall score
                    </p>
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <p className="font-display text-6xl sm:text-7xl font-semibold text-ink-900 tabular-nums leading-none">
                            {hasRubricTotal ? result.rubric_total : '—'}
                            <span className="text-2xl sm:text-3xl text-ink-400">
                                /{hasRubricTotal ? result.rubric_max : '—'}
                            </span>
                        </p>
                        {hasPrevious && Number.isFinite(previousRecording.rubric_total) && hasRubricTotal && (
                            <DeltaBadge
                                current={result.rubric_total}
                                previous={previousRecording.rubric_total}
                                label="vs last draft"
                            />
                        )}
                    </div>
                    <p className={`text-sm font-semibold mt-1 ${TONE_HEADLINE[scoreTone]}`}>
                        {GRADE_LABEL[scoreTone]}
                    </p>
                </div>
            </div>

            {/* TABBED CONTENT AREA */}
            <Tabs
                tabs={[
                    { id: 'transcript', label: 'Transcript', icon: 'file-lines' },
                    { id: 'coach', label: 'Ask Coach', icon: 'chalkboard-user' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                fullWidth={false}
                className="mb-4"
            />

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
            <div className="bg-gradient-to-br from-white to-brand-50/30 rounded-xl shadow-sm border-brand-100 border p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {/* WPM */}
                <div>
                    <p className="text-lg text-ink-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="gauge"
                            className="text-brand-600 me-1"
                        />{" "}
                        WPM
                    </p>
                    <div className="flex items-baseline justify-start gap-2">
                        <p className={`text-2xl font-bold ${TONE_TEXT[wpmTone]}`}>
                            {result.wpm}
                        </p>
                        <p className="text-xs text-paper-500">Words/min</p>
                    </div>
                    <div className="w-full h-2 bg-brand-100 rounded-full mt-2 relative overflow-hidden">
                        <div
                            className={`h-2 rounded-full ${TONE_BAR[wpmTone]}`}
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
                    <p className="text-lg text-ink-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="comment-slash"
                            className="text-brand-600 me-1"
                        />{" "}
                        Filler Words
                    </p>
                    <div className="flex items-baseline justify-start gap-2 flex-wrap">
                        <p className={`text-2xl font-bold ${TONE_TEXT[fillersTone]}`}>
                            {totalFillers}
                        </p>
                        <p className="text-xs text-paper-500">total</p>
                        {hasPrevious && previousFillers !== null && (
                            <DeltaBadge current={totalFillers} previous={previousFillers} lowerIsBetter />
                        )}
                    </div>
                    <div className="text-xs text-paper-500 mt-2 mb-2 flex justify-start gap-2 flex-wrap">
                        {Object.entries(result.filler_count).map(
                            ([w, c], i) => (
                                <span key={i} className="font-bold">
                                    <span className="text-ink-700 font-semibold bg-highlighter rounded-md p-[0.1rem] my-1">
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
                    <p className="text-lg text-ink-700 font-semibold mb-3">
                        <FontAwesomeIcon
                            icon="star"
                            className="text-brand-600 me-1"
                        />{" "}
                        Clarity
                    </p>
                    <div className="flex justify-start items-center flex-wrap gap-2 mb-3">
                        <p className={`text-2xl font-bold ${TONE_TEXT[clarityTone]}`}>
                            {result.clarity_score}
                        </p>
                        <p className="text-xs text-paper-500 me-2">/10</p>
                        <div className="flex text-lg items-center">
                            {[...Array(5)].map((_, i) => (
                                <FontAwesomeIcon
                                    key={i}
                                    icon="star"
                                    className={
                                        i < Math.round(result.clarity_score / 2)
                                            ? "text-accent-400"
                                            : "text-paper-300"
                                    }
                                />
                            ))}
                        </div>
                        {hasPrevious && Number.isFinite(previousRecording.clarity_score) && (
                            <DeltaBadge current={result.clarity_score} previous={previousRecording.clarity_score} precision={1} />
                        )}
                    </div>

                    <div className="flex justify-start gap-2">
                        <FontAwesomeIcon
                            icon="comment-dots"
                            className="text-brand-400"
                        />{" "}
                        <p className="text-xs text-paper-500">
                            {result.pace_feedback}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI FEEDBACK AND RUBRIC */}
            <div className="bg-gradient-to-br from-white to-brand-50/20 rounded-xl shadow-sm border-brand-100 border p-6">
                <p className="text-lg text-ink-700 font-bold mb-3">
                    <FontAwesomeIcon
                        icon="clipboard-list"
                        className="text-brand-600 me-1"
                    />{" "}
                    AI Generated Content Feedback
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FEEDBACK BLOCK */}
                    <div className="grid grid-rows-2 gap-4 pt-4 px-4">
                        {/* KEY STRENGTHS */}
                        <div className="flex-1">
                            <p className="text-good-600 text-lg font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="circle-check"
                                    className="me-2"
                                />
                                Key Strengths
                            </p>
                            {result.ai_feedback.strengths.length > 0 ? (
                                <ul className="list-disc ml-5 text-base text-ink-700 space-y-2">
                                    {result.ai_feedback.strengths.map(
                                        (point, i) => (
                                            <li key={i}>{point}</li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-paper-500 text-sm italic">No strengths listed.</p>
                            )}
                        </div>

                        {/* AREAS TO IMPROVE */}
                        <div className="flex-1">
                            <p className="text-caution-600 text-lg font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="triangle-exclamation"
                                    className="me-2"
                                />
                                Areas to Improve
                            </p>
                            {result.ai_feedback.improvements.length > 0 ? (
                                <ul className="list-disc ml-5 text-base text-ink-700 space-y-2">
                                    {result.ai_feedback.improvements.map(
                                        (point, i) => (
                                            <li key={i}>{point}</li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-paper-500 text-sm italic">No improvements listed.</p>
                            )}
                        </div>
                    </div>

                    {/* RUBRIC BREAKDOWN */}
                    <div>
                        <div className="bg-paper-200 p-4 rounded-xl border-paper-300 border">
                            <p className="text-lg text-ink-700 font-semibold mb-3">
                                <FontAwesomeIcon
                                    icon="chart-simple"
                                    className="text-brand-600 me-1"
                                />{" "}
                                Rubric Breakdown
                            </p>

                            {/* RUBRIC SCORES -- each row is a labelled progress
                                bar, tone-colored per criterion, rather than
                                plain text. */}
                            <div className="space-y-3 text-base text-ink-700">
                                {getRubricScoreEntries(result.rubric_scores).map(
                                    ({ criterion, score, max }, i) => {
                                        const rowTone = Number.isFinite(max) && max > 0
                                            ? getMetricTone('rubric', score, { max })
                                            : 'neutral';
                                        const pct = Number.isFinite(max) && max > 0
                                            ? Math.min(100, Math.max(0, (score / max) * 100))
                                            : 0;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between items-center w-full mb-1">
                                                    <span>{criterion}</span>
                                                    <span className="font-semibold text-ink-800">
                                                        {score}/{max}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-paper-300 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-1.5 rounded-full ${TONE_BAR[rowTone]}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            {/* TOTAL SCORE */}
                            <div className="justify-between items-center flex mt-4">
                                <span className="font-semibold text-paper-500 text-sm">
                                    Total Score:{" "}
                                </span>
                                <span className="font-bold text-lg text-brand-600 bg-brand-100 py-[0.15rem] px-1 rounded-md">
                                    {result.rubric_total}/{result.rubric_max}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
