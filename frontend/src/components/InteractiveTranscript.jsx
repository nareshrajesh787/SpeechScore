import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

                const className = `
                    inline-block px-1 mx-0.5 rounded transition-all cursor-pointer
                    ${isHighlighted ? 'bg-indigo-200 scale-105' : ''}
                    ${isFiller || isPair ? 'text-red-600 bg-red-50 border-b-2 border-red-200 hover:bg-red-100' : 'text-gray-700 hover:bg-indigo-50'}
                `.trim();

                return (
                    <span
                        key={index}
                        id={`word-${index}`}
                        className={className}
                        onClick={() => handleWordClick(index)}
                        title={`Click to play from "${displayText}" (${(word.start / 1000).toFixed(2)}s)`}
                    >
                        {displayText}
                    </span>
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
                            <span className="text-red-600 bg-red-50 border-b-2 border-red-200 rounded-md px-1 cursor-pointer hover:bg-red-100">
                                {word} {nextWord}
                            </span>{' '}
                        </span>
                    );
                } else if (isFiller) {
                    return (
                        <span key={index} className="text-red-600 bg-red-50 border-b-2 border-red-200 rounded-md px-1 cursor-pointer hover:bg-red-100">
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
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-800">
                    <FontAwesomeIcon icon="file-audio" className="text-indigo-600 mr-2" />
                    Interactive Transcript
                </h2>
                {audioUrl && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlayPause}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={isPlaying ? 'pause' : 'play'} />
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        {audioDuration && (
                            <span className="text-sm text-gray-500">
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
                className="text-base text-gray-600 leading-loose p-4 bg-white rounded-lg border border-gray-100 max-h-96 overflow-y-auto"
            >
                {renderTranscript()}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                <FontAwesomeIcon icon="info-circle" className="mr-1" />
                {audioUrl ? (
                    <>Click any word to jump to that moment in the audio. Filler words are highlighted in red.</>
                ) : (
                    <>Filler words are highlighted in red. Audio playback is not available for this recording.</>
                )}
            </div>
        </div>
    );
}
