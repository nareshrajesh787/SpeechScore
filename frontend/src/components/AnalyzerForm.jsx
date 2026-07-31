import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RUBRIC_PRESETS } from '../utils/rubrics';
import Button from './ui/Button';

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
    return (
        <form onSubmit={handleSubmit}>
            <label
                htmlFor="audio-upload"
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
                    <p className="text-xs text-gray-500 mt-1">
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
                        <label htmlFor="scenario-preset" className="block text-sm font-bold mb-2">
                            Scenario / Preset
                        </label>
                        <select
                            id="scenario-preset"
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
            <Button
                type="submit"
                disabled={!audioFile || isLoading || isUploadingAudio}
                className="mt-7 mb-2 w-full px-6 py-2 rounded-3xl disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            </Button>
        </form>
    );
}
