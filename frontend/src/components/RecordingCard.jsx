import React from 'react';
import Card from './ui/Card';
import Metric from './ui/Metric';
import DeltaBadge from './ui/DeltaBadge';
import { getAiFeedback, getFillerTotal } from '../utils/normalizeRecording';
import { formatRelativeDate } from '../utils/formatDate';

const RecordingCard = ({
    recording,
    onClick,
    className = "",
    as = "div",
    selected = false,
    showDelete = false, // Optional: if we want to include delete button inside or handle externally
    onDelete = null,
    isDraft, // Optional: explicit override. Falls back to recording.isDraft.
    draftNumber, // Optional: explicit override. Falls back to recording.draftNumber.
    previousRecording = null, // Optional: the chronologically-previous draft, for delta chips.
}) => {
    // Determine data source (handle potential differences between raw firestore data and formatted data)
    const recordedAt = recording.createdAt?.toDate ? recording.createdAt.toDate() :
        (recording.timestamp?.toDate ? recording.timestamp.toDate() : null);
    const date = recordedAt ? formatRelativeDate(recordedAt) : "";

    const showAsDraft = isDraft ?? recording.isDraft;
    const resolvedDraftNumber = draftNumber ?? recording.draftNumber;

    // Metric renders its own em-dash placeholder for missing values, so pass
    // the raw null through rather than substituting a string here.
    const totalFillers = getFillerTotal(recording.filler_count);

    // Normalize arrays
    const { strengths } = getAiFeedback(recording);

    const transcriptSnippet = (recording.transcript || "").slice(0, 160);
    const hasMoreTranscript = (recording.transcript || "").length > 160;

    // Delta chips vs the previous draft. WPM is deliberately excluded here --
    // see the matching comment in ResultPanel.jsx: "better" WPM means "closer
    // to the ideal band," not simply higher or lower, so a naive signed delta
    // would misreport direction of improvement. Fillers/clarity/rubric are
    // all genuinely monotonic, so those get real delta badges.
    const previousFillers = previousRecording ? getFillerTotal(previousRecording.filler_count) : null;

    return (
        <Card
            as={as}
            onClick={onClick}
            className={`text-left flex flex-col w-full ${selected ? 'border-brand-600 ring-1 ring-brand-600' : 'hover:border-brand-200'} ${className}`}
            padding="p-5"
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display text-lg font-semibold text-ink-900 truncate">
                    {recording.name || (showAsDraft ? `Draft ${resolvedDraftNumber}` : "Analysis")}
                </h2>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {date && (
                        <span className="text-xs text-paper-500" title={recordedAt?.toLocaleString()}>
                            {date}
                        </span>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(recording);
                            }}
                            className="p-3.5 -m-1.5 text-ink-400 hover:text-needs-work-500 hover:bg-needs-work-50 rounded-lg transition-colors"
                            title="Delete recording"
                        >
                            <span className="sr-only">Delete</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Each tile derives its own semantic tone, so an out-of-range
                value reads as out-of-range at a glance instead of looking
                identical to a good one. */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <Metric label="WPM" value={recording.wpm} type="wpm" />
                <Metric
                    label="Fillers"
                    value={totalFillers}
                    type="fillers"
                    durationSeconds={recording.audio_duration}
                />
                <Metric label="Clarity" value={recording.clarity_score} type="clarity" />
                <Metric
                    label="Rubric"
                    value={recording.rubric_total}
                    max={recording.rubric_max}
                    type="rubric"
                />
            </div>

            {previousRecording && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {Number.isFinite(recording.rubric_total) && Number.isFinite(previousRecording.rubric_total) && (
                        <DeltaBadge current={recording.rubric_total} previous={previousRecording.rubric_total} label="score" />
                    )}
                    {totalFillers !== null && previousFillers !== null && (
                        <DeltaBadge current={totalFillers} previous={previousFillers} lowerIsBetter label="fillers" />
                    )}
                    {Number.isFinite(recording.clarity_score) && Number.isFinite(previousRecording.clarity_score) && (
                        <DeltaBadge current={recording.clarity_score} previous={previousRecording.clarity_score} precision={1} label="clarity" />
                    )}
                </div>
            )}

            {recording.pace_feedback && (
                <div className="mb-3">
                    <p className="text-sm text-ink-700"><span className="font-semibold">Pace:</span> {recording.pace_feedback}</p>
                </div>
            )}

            {transcriptSnippet && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-ink-600 mb-1">Transcript</p>
                    <p className="text-sm text-ink-700 line-clamp-3">
                        {transcriptSnippet}{hasMoreTranscript ? '…' : ''}
                    </p>
                </div>
            )}

            {(strengths.length > 0) && (
                <div className="mt-auto">
                    <div className="mb-2">
                        <p className="text-xs font-semibold text-ink-600 mb-1">AI Strengths</p>
                        <div className="flex flex-wrap gap-2">
                            {strengths.slice(0, 2).map((s, idx) => (
                                <span key={idx} className="text-xs bg-good-50 text-good-700 border border-good-200 rounded-full px-2 py-1">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RecordingCard;
