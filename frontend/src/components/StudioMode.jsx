import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function StudioMode({ onRecordingComplete, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup audio visualization
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            // Start waveform visualization
            drawWaveform();

        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Failed to access microphone. Please check permissions.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            drawWaveform();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording || isPaused) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#4f46e5');
                gradient.addColorStop(1, '#9333ea');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleUseRecording = () => {
        if (audioBlob) {
            // Convert webm to a format that can be uploaded
            const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
            onRecordingComplete(file);
        }
    };

    const handleRetry = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setError(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };

    if (audioBlob && audioUrl) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-indigo-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    <FontAwesomeIcon icon="microphone" className="text-indigo-600 mr-2" />
                    Recording Complete
                </h3>
                <div className="mb-4">
                    <audio src={audioUrl} controls className="w-full" />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleUseRecording}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                    >
                        <FontAwesomeIcon icon="check" className="mr-2" />
                        Use This Recording
                    </button>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition"
                    >
                        <FontAwesomeIcon icon="redo" className="mr-2" />
                        Retry
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-8 border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                <FontAwesomeIcon icon="microphone" className="text-indigo-600 mr-2" />
                Studio Mode Recording
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg">
                    {error}
                </div>
            )}

            {!isRecording ? (
                <div className="text-center">
                    <p className="text-gray-600 mb-6">
                        Record your speech directly in the browser. Click start when ready.
                    </p>
                    <button
                        onClick={startRecording}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-md"
                    >
                        <FontAwesomeIcon icon="circle" className="mr-2" />
                        Start Recording
                    </button>
                </div>
            ) : (
                <div>
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-indigo-600 mb-2">
                                    {formatTime(recordingTime)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {isPaused ? 'Paused' : 'Recording...'}
                                </div>
                            </div>
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={150}
                            className="w-full h-32 bg-zinc-50 rounded-xl border border-indigo-100"
                        />
                    </div>

                    <div className="flex gap-3 justify-center">
                        {isPaused ? (
                            <button
                                onClick={resumeRecording}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                <FontAwesomeIcon icon="play" className="mr-2" />
                                Resume
                            </button>
                        ) : (
                            <button
                                onClick={pauseRecording}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                <FontAwesomeIcon icon="pause" className="mr-2" />
                                Pause
                            </button>
                        )}
                        <button
                            onClick={stopRecording}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                        >
                            <FontAwesomeIcon icon="stop" className="mr-2" />
                            Stop
                        </button>
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
