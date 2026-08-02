import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from './ui/Button';
import Card from './ui/Card';

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
            <Card padding="p-8" className="border-brand-100">
                <h3 className="text-xl font-bold text-ink-800 mb-4">
                    <FontAwesomeIcon icon="microphone" className="text-brand-600 mr-2" />
                    Recording Complete
                </h3>
                <div className="mb-4">
                    <audio src={audioUrl} controls className="w-full" />
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        onClick={handleUseRecording}
                        className="flex-1 px-6 py-3"
                    >
                        <FontAwesomeIcon icon="check" />
                        Use This Recording
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleRetry}
                        className="px-6 py-3"
                    >
                        <FontAwesomeIcon icon="redo" />
                        Retry
                    </Button>
                    {onCancel && (
                        <Button
                            variant="secondary"
                            onClick={onCancel}
                            className="px-6 py-3"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card padding="p-8" className="border-brand-100">
            <h3 className="text-xl font-bold text-ink-800 mb-4">
                <FontAwesomeIcon icon="microphone" className="text-brand-600 mr-2" />
                Studio Mode Recording
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-needs-work-50 text-needs-work-700 border border-needs-work-100 rounded-lg">
                    {error}
                </div>
            )}

            {!isRecording ? (
                <div className="text-center">
                    <p className="text-ink-600 mb-6">
                        Record your speech directly in the browser. Click start when ready.
                    </p>
                    {/* `mx-auto w-fit` keeps this centered: Button's base styles make it a
                        flex container, which would otherwise stretch to the full width of
                        the `text-center` wrapper instead of hugging its label. */}
                    <Button
                        variant="primary"
                        onClick={startRecording}
                        className="mx-auto w-fit px-8 py-4 text-lg shadow-md"
                    >
                        <FontAwesomeIcon icon="circle" />
                        Start Recording
                    </Button>
                </div>
            ) : (
                <div>
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-brand-600 mb-2">
                                    {formatTime(recordingTime)}
                                </div>
                                <div className="text-sm text-paper-500">
                                    {isPaused ? 'Paused' : 'Recording...'}
                                </div>
                            </div>
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={150}
                            className="w-full h-32 bg-paper-100 rounded-xl border border-brand-100"
                        />
                    </div>

                    <div className="flex gap-3 justify-center">
                        {isPaused ? (
                            <Button
                                variant="primary"
                                onClick={resumeRecording}
                                className="px-6 py-3"
                            >
                                <FontAwesomeIcon icon="play" className="mr-2" />
                                Resume
                            </Button>
                        ) : (
                            <Button
                                variant="warning"
                                onClick={pauseRecording}
                                className="px-6 py-3"
                            >
                                <FontAwesomeIcon icon="pause" className="mr-2" />
                                Pause
                            </Button>
                        )}
                        <Button
                            variant="danger"
                            onClick={stopRecording}
                            className="px-6 py-3"
                        >
                            <FontAwesomeIcon icon="stop" className="mr-2" />
                            Stop
                        </Button>
                        {onCancel && (
                            <Button
                                variant="secondary"
                                onClick={onCancel}
                                className="px-6 py-3"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
