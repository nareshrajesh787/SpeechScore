import React from 'react';
import Card from './ui/Card';

const RecordingCard = ({
    recording,
    onClick,
    className = "",
    as = "div",
    selected = false,
    showDelete = false, // Optional: if we want to include delete button inside or handle externally
    onDelete = null
}) => {
    // Determine data source (handle potential differences between raw firestore data and formatted data)
    const date = recording.createdAt?.toDate ? recording.createdAt.toDate().toLocaleString() :
        (recording.timestamp?.toDate ? recording.timestamp.toDate().toLocaleString() : "");

    // Handle different naming conventions (Dashboard uses 'feedback' array with slightly different structure vs ProjectView)
    // We'll normalize to the structure used in the requested snippet

    const wpm = recording.wpm ?? "—";
    const clarity = recording.clarity_score ?? "—";

    // Normalize rubric score
    const scoreLabel = (recording.rubric_total != null && recording.rubric_max != null)
        ? `${recording.rubric_total}/${recording.rubric_max}`
        : "—";

    // Normalize filler count
    const fillerCountVal = recording.filler_count;
    const totalFillers = typeof fillerCountVal === 'object' && fillerCountVal !== null
        ? Object.values(fillerCountVal).reduce((sum, count) => sum + count, 0)
        : (typeof fillerCountVal === 'number' ? fillerCountVal : "—");

    // Normalize arrays
    const rawStrengths = recording.ai_feedback?.strengths || recording.strengths || [];
    const strengths = Array.isArray(rawStrengths) ? rawStrengths : [];

    const rawImprovements = recording.ai_feedback?.improvements || recording.improvements || [];
    const improvements = Array.isArray(rawImprovements) ? rawImprovements : [];

    const transcriptSnippet = (recording.transcript || "").slice(0, 160);
    const hasMoreTranscript = (recording.transcript || "").length > 160;

    return (
        <Card
            as={as}
            onClick={onClick}
            className={`text-left flex flex-col w-full group relative ${selected ? 'border-indigo-600 ring-1 ring-indigo-600' : 'hover:border-indigo-200'} ${className}`}
            padding="p-5"
        >
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    {recording.name || (recording.isDraft ? `Draft ${recording.draftNumber}` : "Analysis")}
                </h2>
                {date && <span className="text-xs text-gray-500">{date}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600">WPM</p>
                    <p className="text-xl font-bold text-indigo-700">{wpm}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600">Fillers</p>
                    <p className="text-xl font-bold text-indigo-700">{totalFillers}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600">Clarity</p>
                    <p className="text-xl font-bold text-indigo-700">{clarity}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600">Rubric</p>
                    <p className="text-xl font-bold text-indigo-700">{scoreLabel}</p>
                </div>
            </div>

            {recording.pace_feedback && (
                <div className="mb-3">
                    <p className="text-sm text-gray-700"><span className="font-semibold">Pace:</span> {recording.pace_feedback}</p>
                </div>
            )}

            {transcriptSnippet && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Transcript</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                        {transcriptSnippet}{hasMoreTranscript ? '…' : ''}
                    </p>
                </div>
            )}

            {(strengths.length > 0) && (
                <div className="mt-auto">
                    <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">AI Strengths</p>
                        <div className="flex flex-wrap gap-2">
                            {strengths.slice(0, 2).map((s, idx) => (
                                <span key={idx} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-1">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Optional delete button overlay */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(recording);
                    }}
                    className="absolute top-4 right-12 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete recording"
                >
                    {/* Icon handled by parent or passed in? Keeping it simple for now, using text or finding icon */}
                    <span className="sr-only">Delete</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
        </Card>
    );
};

export default RecordingCard;
