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

/**
 * One numbered step of the worksheet. The analyzer used to be a single
 * undifferentiated column of four fields; numbering the decisions gives the
 * page a spine and matches the "coach's worksheet" direction.
 */
const Step = ({ number, title, hint, children }) => (
    <section className="border-t border-paper-300 pt-6 first:border-t-0 first:pt-0">
        <div className="flex items-baseline gap-3 mb-1">
            <span
                aria-hidden="true"
                className="font-display text-sm font-semibold text-brand-600 bg-brand-50 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0"
            >
                {number}
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        </div>
        {hint && <p className="text-sm text-ink-500 mb-4 ml-9">{hint}</p>}
        <div className="sm:ml-9">{children}</div>
    </section>
);

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <Step
                number={1}
                title="Your recording"
                hint="Drop in an audio file, or switch to Studio Mode to record right here."
            >
                <input
                    type="file"
                    id="audio-upload"
                    name="audioFile"
                    accept="audio/*"
                    required={!audioFile}
                    className="sr-only"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                />

                {audioFile ? (
                    // Selected state. The old form only swapped the dropzone's
                    // caption to the filename, which read as "nothing happened".
                    <div className="flex items-center gap-4 p-4 bg-good-50 border border-good-200 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-good-100 flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon="file-audio" className="text-good-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink-800 truncate">{audioFile.name}</p>
                            <p className="text-xs text-good-700">
                                <FontAwesomeIcon icon="circle-check" className="mr-1" />
                                Ready to analyze · {formatBytes(audioFile.size)}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button as="label" htmlFor="audio-upload" variant="subtle" className="cursor-pointer text-sm">
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
                        className={`group flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer transition-colors ${isDragging
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-paper-400 bg-paper-50 hover:border-brand-400 hover:bg-brand-50/40'
                            }`}
                    >
                        <FontAwesomeIcon
                            icon="cloud-arrow-up"
                            className={`text-4xl mb-3 transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'text-brand-600' : 'text-paper-500'}`}
                        />
                        <p className="text-sm font-semibold text-ink-800">
                            {isDragging ? 'Drop to upload' : 'Drop an audio file here, or browse'}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">MP3, WAV, M4A · up to 20MB</p>
                    </label>
                )}
            </Step>

            <Step
                number={2}
                title="What are you practicing?"
                hint="The prompt you're responding to. The coach uses this to judge whether you actually answered it."
            >
                {/* The step heading is an <h2>, which is not a label, so the
                    association has to be made explicitly. Visually hidden
                    because the heading already says this on screen. */}
                <label htmlFor="prompt" className="sr-only">Speech prompt</label>
                <textarea
                    name="prompt"
                    value={prompt}
                    required
                    className={INPUT_CLASS}
                    id="prompt"
                    rows="3"
                    placeholder="e.g. 'Describe a challenge you overcame' — or paste your assignment question"
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </Step>

            <Step
                number={3}
                title="How should we score it?"
                hint="Pick a scenario to load a ready-made rubric, then tweak it if you like."
            >
                {!projectId && (
                    <div className="mb-4">
                        <label htmlFor="scenario-preset" className="block text-sm font-semibold text-ink-700 mb-2">
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

                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <label htmlFor="rubric" className="text-sm font-semibold text-ink-700">
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
                    rows="3"
                    placeholder="e.g. 'Content clarity, supporting evidence, engagement…'"
                    onChange={handleRubricChange}
                />
            </Step>

            <div className="border-t border-paper-300 pt-6">
                <Button
                    type="submit"
                    disabled={!audioFile || busy}
                    className="w-full py-3 text-base"
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
                        Add a recording in step 1 to get started.
                    </p>
                )}
            </div>
        </form>
    );
}
