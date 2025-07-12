import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import ResultPanel from './ResultPanel';
import Navbar from './Navbar';

export default function SpeechAnalyzerPage() {
    const [audioFile, setAudioFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [rubric, setRubric] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    //const [result, setResult] = useState(null);
    const result = {
        "transcript": "So. Hi, everyone. Today I'm gonna be talking about, you know, why I'd be a great intern for your company? I guess, like, one of my biggest strengths is teamwork. Kind of. I actually worked on a group project recently where we had to build a business plan under a tight deadline. I mean, I helped keep everyone organized and motivated, which was cool, but also, like, I. I had trouble managing time at first, which I've been working on. So, yeah, overall, I think I'm a good fit because I'm adaptable, willing to learn, and not afraid to fail.",
        "audio_duration": 38,
        "wpm": 158,
        "filler_count": {
          "so": 2,
          "you know": 1,
          "like": 2,
          "kind of": 1,
          "actually": 1,
          "i mean": 1
        },
        "clarity_score": 8.7,
        "pace_feedback": "Great pace!",
        "ai_feedback": {
          "strengths": [
            "Clear structure and logical flow",
            "Good supporting details",
            "Engaging introduction"
          ],
          "improvements": [
            "Slow down during important points",
            "Add more examples for depth"
          ]
        },
        "rubric_scores": {
          "Structure": 4,
          "Evidence": 4,
          "Clarity": 4.5,
          "Engagement": 4.5
        },
        "rubric_total": 17,
        "rubric_max": 20
      }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (audioFile) {
            setIsLoading(true)
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('prompt', prompt);
            formData.append('rubric', rubric);
            const response = await fetch('http://127.0.0.1:8000/api/analyze', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json()
            setResult(data)
            setIsLoading(false)
        }
    }

    return (
        <div className='bg-zinc-50 min-h-screen'>
            <Navbar />
            <div className={ result
                ? "p-6 grid grid-cols-1 md:grid-cols-2"
                : "p-6 grid grid-cols-1"}>
                <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 mt-12 shadow-lg">
                    <h1 className="font-bold text-4xl text-center text-gray-800"><FontAwesomeIcon className='text-indigo-600' icon={'bolt'} /> Analyze Your Speech</h1>
                    <p className="text-center font-medium text-gray-500 px-5 mt-4 mb-5">Upload your recording, provide your prompt and rubric for personalized AI feedback. Receive instant, actionable results.</p>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="audioFile" className='text-sm font-bold'>Audio File<span className='text-amber-500'>*</span></label>
                        <div className="border-indigo-300 group border-2 border-dashed rounded-xl p-6 mt-2 text-gray-500 text-center hover:bg-indigo-50 cursor-pointer">
                            <input type='file' id='audio-upload' name='audioFile' accept='audio/*' required style={{display: 'none'}} onChange={(e)=>setAudioFile(e.target.files[0])} />
                            <label htmlFor="audio-upload" className="block cursor-pointer text-indigo-600 font-semibold mt-2">
                                <FontAwesomeIcon icon={'cloud-arrow-up'} className='text-indigo-500 text-5xl mb-4 group-hover:scale-[1.2] transition-transform duration-300' />
                                <p className="text-sm text-gray-700 font-medium">{audioFile ? audioFile.name : "Click or drag to upload .mp3, .wav"}</p>
                                <p className="text-xs text-gray-400 mt-1">Max 20MB</p>
                            </label>
                        </div>
                        <div className='mt-5'>
                        <label htmlFor="prompt" className='text-sm font-bold'>Speech Prompt<span className='text-amber-500'>*</span></label>
                        <textarea name="prompt" value={prompt} required className='w-full mt-2 p-2 border rounded-xl bg-gray-50 font-[400]' id="prompt" rows="3" placeholder="E.g. 'Describe a challenge you overcame' or paste your assignment question" onChange={(e)=>setPrompt(e.target.value)} />
                        </div>
                        <div className='mt-5'>
                        <label htmlFor="rubric" className='text-sm font-bold'>Evaluation Rubric<span className='text-amber-500'>*</span></label>
                            <textarea name="rubric" value={rubric} required className='w-full mt-2 p-2 border rounded-xl bg-gray-50' id="rubric" rows="3" placeholder="E.g. 'Content clarity, supporting evidence, engagement...' " onChange={(e)=>setRubric(e.target.value)} />
                        </div>
                        <button type="submit" className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-6 py-2 rounded-3xl font-semibold">
                            {isLoading ? "Analyzing..." : <>Analyze Speech <FontAwesomeIcon className='mr-2' icon='arrow-right' /></>}
                        </button>
                    </form>


                </div>

                {result && <ResultPanel result={result} />}
            </div>
        </div>
    )
}
