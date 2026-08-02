import { useState, useRef, useEffect, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from './ui/Button';

export default function InteractiveTranscript({ 
    transcript, 
    wordTimestamps, 
    fillerCount, 
    audioUrl,
    audioDuration 
}) {
    const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const transcriptRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime * 1000); // Convert to ms
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setHighlightedWordIndex(null);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl]);

    // Highlight current word based on audio playback
    useEffect(() => {
        if (!wordTimestamps || !isPlaying) return;

        const currentWordIndex = wordTimestamps.findIndex(
            (word, index) => {
                const nextWord = wordTimestamps[index + 1];
                return currentTime >= word.start && 
                       (nextWord ? currentTime < nextWord.start : currentTime <= word.end);
            }
        );

        if (currentWordIndex !== -1 && currentWordIndex !== highlightedWordIndex) {
            setHighlightedWordIndex(currentWordIndex);
            
            // Auto-scroll to highlighted word
            const wordElement = document.getElementById(`word-${currentWordIndex}`);
            if (wordElement) {
                wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime, isPlaying, wordTimestamps, highlightedWordIndex]);

    const handleWordClick = (wordIndex) => {
        if (!wordTimestamps || !audioRef.current) return;

        const word = wordTimestamps[wordIndex];
        if (word) {
            audioRef.current.currentTime = word.start / 1000; // Convert ms to seconds
            if (!isPlaying) {
                audioRef.current.play();
            }
        }
    };

    const handleWordKeyDown = (e, wordIndex) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleWordClick(wordIndex);
        }
    };

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const isFillerWord = (text) => {
        if (!fillerCount) return false;
        const normalized = text.toLowerCase().replace(/[^a-zA-Z]/g, '');
        return fillerCount.hasOwnProperty(normalized);
    };

    const isFillerPair = (text1, text2) => {
        if (!fillerCount || !text2) return false;
        const normalized1 = text1.toLowerCase().replace(/[^a-zA-Z]/g, '');
        const normalized2 = text2.toLowerCase().replace(/[^a-zA-Z]/g, '');
        const pair = `${normalized1} ${normalized2}`;
        return fillerCount.hasOwnProperty(pair);
    };

    // Render transcript with word timestamps if available, otherwise fallback to plain text
    const renderTranscript = () => {
        if (wordTimestamps && wordTimestamps.length > 0) {
            return wordTimestamps.map((word, index) => {
                const isHighlighted = highlightedWordIndex === index;
                const isFiller = isFillerWord(word.text);
                const isPair = index < wordTimestamps.length - 1 && 
                              isFillerPair(word.text, wordTimestamps[index + 1]?.text);
                
                // Skip if this is the second word of a pair
                if (index > 0 && isFillerPair(wordTimestamps[index - 1].text, word.text)) {
                    return null;
                }

                // Handle filler word pairs
                let displayText = word.text;
                let wordCount = 1;
                if (isPair && index < wordTimestamps.length - 1) {
                    displayText = `${word.text} ${wordTimestamps[index + 1].text}`;
                    wordCount = 2;
                }

                // The playing-word indicator (ring + scale) layers on top of the
                // filler treatment rather than overriding it, so a word that is
                // both a filler and the currently-playing word stays readable as
                // "marked with a highlighter" while still showing it's playing.
                const highlightedClasses = isHighlighted
                    ? `inline-block scale-105 ${isFiller || isPair ? 'ring-2 ring-brand-400' : 'bg-brand-200'}`
                    : '';
                const fillerClasses = isFiller || isPair
                    ? 'px-0.5 bg-highlighter text-ink-800 hover:bg-highlighter-strong'
                    : 'text-ink-700 hover:bg-brand-50';

                const className = `
                    rounded transition-all cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
                    ${highlightedClasses}
                    ${fillerClasses}
                `.trim();

                return (
                    <Fragment key={index}>
                        <span
                            id={`word-${index}`}
                            className={className}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleWordClick(index)}
                            onKeyDown={(e) => handleWordKeyDown(e, index)}
                            title={`Click to play from "${displayText}" (${(word.start / 1000).toFixed(2)}s)`}
                            aria-label={`Play from "${displayText}" at ${(word.start / 1000).toFixed(2)} seconds`}
                        >
                            {displayText}
                        </span>
                        {' '}
                    </Fragment>
                );
            }).filter(Boolean);
        } else {
            // Fallback: render plain transcript with filler word highlighting
            const words = transcript.split(' ');
            const fillerWords = fillerCount ? Object.keys(fillerCount) : [];
            
            return words.map((word, index) => {
                const normalized = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
                const isFiller = fillerWords.includes(normalized);
                
                // Check for pairs
                const nextWord = words[index + 1];
                const normalizedNext = nextWord ? nextWord.toLowerCase().replace(/[^a-zA-Z]/g, '') : '';
                const pair = nextWord ? `${normalized} ${normalizedNext}` : null;
                const isPair = pair && fillerWords.includes(pair);

                if (isPair) {
                    return (
                        <span key={index}>
                            <span className="bg-highlighter text-ink-800 rounded-md px-1 cursor-pointer hover:bg-highlighter-strong">
                                {word} {nextWord}
                            </span>{' '}
                        </span>
                    );
                } else if (isFiller) {
                    return (
                        <span key={index} className="bg-highlighter text-ink-800 rounded-md px-1 cursor-pointer hover:bg-highlighter-strong">
                            {word}{' '}
                        </span>
                    );
                } else {
                    return <span key={index}>{word} </span>;
                }
            });
        }
    };

    return (
        <div className="bg-gradient-to-br from-white to-paper-50 p-6 rounded-xl border border-paper-300 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-ink-800">
                    <FontAwesomeIcon icon="file-audio" className="text-brand-600 mr-2" />
                    Interactive Transcript
                </h2>
                {audioUrl && (
                    <div className="flex items-center gap-3">
                        <Button variant="primary" onClick={togglePlayPause}>
                            <FontAwesomeIcon icon={isPlaying ? 'pause' : 'play'} />
                            {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        {audioDuration && (
                            <span className="text-sm text-paper-500">
                                {Math.floor(currentTime / 1000)}s / {Math.floor(audioDuration)}s
                            </span>
                        )}
                    </div>
                )}
            </div>

            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    className="hidden"
                />
            )}

            <div 
                ref={transcriptRef}
                className="text-base text-ink-600 leading-loose p-4 bg-white rounded-lg border border-paper-200 max-h-96 overflow-y-auto"
            >
                {renderTranscript()}
            </div>

            <div className="mt-4 text-xs text-paper-500">
                <FontAwesomeIcon icon="info-circle" className="mr-1" />
                {audioUrl ? (
                    <>Click any word to jump to that moment in the audio. Filler words are highlighted for you to work on.</>
                ) : (
                    <>Filler words are highlighted for you to work on. Audio playback is not available for this recording.</>
                )}
            </div>
        </div>
    );
}
