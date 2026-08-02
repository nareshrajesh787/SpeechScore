import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import Button from './ui/Button';

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|webm|aac|flac)$/i;
const isAudioFile = (file) => Boolean(file) && (file.type.startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name));

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Shared input chrome. Previously the two textareas were filled (bg-gray-50)
// while the select was white, so the same form spoke two different input
// languages.
const INPUT_CLASS =
    'w-full px-4 py-3 bg-white border border-paper-300 rounded-xl text-ink-800 placeholder:text-ink-400 ' +
    'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors';

export default function AnalyzerForm({
    audioFile,
    setAudioFile,
    prompt,
    setPrompt,
    rubric,
    projectId,
    selectedScenario,
    handleScenarioChange,
    presetName,
    handleRubricChange,
    isLoading,
    isUploadingAudio,
    handleSubmit
}) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (isAudioFile(file)) setAudioFile(file);
    };

    const busy = isLoading || isUploadingAudio;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <input
                type="file"
                id="audio-upload"
                name="audioFile"
                accept="audio/*"
                required={!audioFile}
                className="sr-only"
                onChange={(e) => setAudioFile(e.target.files[0])}
            />

            {/* The recording is the whole point of this page, so it gets the
                full-width hero treatment instead of living inside a boxed
                "step" like the other fields. Both states keep a similar
                footprint so choosing a file doesn't cause the page to jump. */}
            {audioFile ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-2 border-good-200 bg-good-50 rounded-3xl px-6 py-10 sm:py-12 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-good-100 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        <FontAwesomeIcon icon="file-audio" className="text-good-700 text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-display text-xl font-semibold text-ink-900 truncate">{audioFile.name}</p>
                        <p className="text-sm text-good-700 mt-1">
                            <FontAwesomeIcon icon="circle-check" className="mr-1" />
                            Ready to analyze · {formatBytes(audioFile.size)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 justify-center flex-shrink-0">
                        <Button as="label" htmlFor="audio-upload" variant="secondary" className="cursor-pointer">
                            Replace
                        </Button>
                        <Button
                            type="button"
                            variant="subtle"
                            size="icon"
                            onClick={() => setAudioFile(null)}
                            title="Remove file"
                        >
                            <span className="sr-only">Remove file</span>
                            <FontAwesomeIcon icon="times" />
                        </Button>
                    </div>
                </div>
            ) : (
                <label
                    htmlFor="audio-upload"
                    data-testid="audio-dropzone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl px-6 py-16 sm:py-20 cursor-pointer transition-colors ${isDragging
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-paper-400 bg-paper-50 hover:border-brand-400 hover:bg-brand-50/40'
                        }`}
                >
                    <FontAwesomeIcon
                        icon="cloud-arrow-up"
                        className={`text-5xl sm:text-6xl mb-4 transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'text-brand-600' : 'text-paper-500'}`}
                    />
                    <p className="font-display text-xl sm:text-2xl font-semibold text-ink-900">
                        {isDragging ? 'Drop to upload' : 'Drop your recording here'}
                    </p>
                    <p className="text-sm text-ink-500 mt-2">or click to browse · MP3, WAV, M4A · up to 20MB</p>
                </label>
            )}

            {/* Context strip. Two fields side by side instead of stacked, so
                they read as quick supporting details rather than more of the
                same "step" the recording just was. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-semibold text-ink-800 mb-1">
                        What are you practicing?
                    </label>
                    <p className="text-xs text-ink-500 mb-3">
                        The coach checks whether you actually answered this.
                    </p>
                    <textarea
                        name="prompt"
                        value={prompt}
                        required
                        className={INPUT_CLASS}
                        id="prompt"
                        rows="4"
                        placeholder="e.g. 'Describe a challenge you overcame' — or paste your assignment question"
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="rubric" className="block text-sm font-semibold text-ink-800 mb-1">
                        How should we score it?
                    </label>
                    <p className="text-xs text-ink-500 mb-3">
                        Pick a scenario for a ready-made rubric, or write your own.
                    </p>

                    {!projectId && (
                        <div className="mb-3">
                            <label htmlFor="scenario-preset" className="block text-xs font-semibold text-ink-600 uppercase tracking-wide mb-1.5">
                                Scenario
                            </label>
                            <select
                                id="scenario-preset"
                                value={selectedScenario}
                                onChange={handleScenarioChange}
                                className={INPUT_CLASS}
                            >
                                {Object.keys(RUBRIC_PRESETS).map((key) => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                        <label htmlFor="rubric" className="text-xs font-semibold text-ink-600 uppercase tracking-wide">
                            Evaluation rubric
                        </label>
                        {presetName && presetName !== 'Custom' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                Using the "{presetName}" preset
                            </span>
                        )}
                    </div>
                    <textarea
                        name="rubric"
                        value={rubric}
                        required
                        className={INPUT_CLASS}
                        id="rubric"
                        rows="4"
                        placeholder="e.g. 'Content clarity, supporting evidence, engagement…'"
                        onChange={handleRubricChange}
                    />
                </div>
            </div>

            <div>
                <Button
                    type="submit"
                    disabled={!audioFile || busy}
                    className="w-full py-4 text-base"
                >
                    {isUploadingAudio ? 'Uploading audio…' : isLoading ? 'Analyzing…' : (
                        <>
                            Analyze speech
                            <FontAwesomeIcon icon="arrow-right" />
                        </>
                    )}
                </Button>
                {!audioFile && (
                    <p className="text-xs text-ink-500 text-center mt-3">
                        Add a recording above to get started.
                    </p>
                )}
            </div>
        </form>
    );
}
