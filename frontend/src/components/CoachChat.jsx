import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { API_URL } from "../config";

export default function CoachChat({ transcript, rubricFeedback }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare chat history for the API
            // Filter out any temp messages if we had them or failed ones
            // And ensure we send what backend expects
            const chatHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Construct the optional rubric feedback string
            // rubricFeedback might be a complex object, so we verify how we receive it
            // For now, let's assume we pass a JSON string of it or a summary if it's an object
            const rubricStr = typeof rubricFeedback === 'string'
                ? rubricFeedback
                : JSON.stringify(rubricFeedback);

            const response = await fetch(`${API_URL}/api/coach/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transcript: transcript,
                    rubric_feedback: rubricStr,
                    chat_history: chatHistory,
                    user_question: userMsg.content,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            const assistantMsg = { role: "assistant", content: data.response };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            console.error("Coach chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I'm having trouble connecting right now. Please try again.",
                    isError: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header / Intro */}
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                        <FontAwesomeIcon icon="chalkboard-user" className="text-3xl text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Ask the Coach</h3>
                    <p className="max-w-xs">
                        I've analyzed your speech. Ask me specifically about your intro, pacing, or how to improve specific sections!
                    </p>
                </div>
            )}

            {/* Messages List */}
            {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                                    }`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-500 uppercase tracking-wide">
                                        <FontAwesomeIcon icon="robot" /> Coach
                                    </div>
                                )}
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your speech..."
                        className="w-full resize-none rounded-xl border border-gray-300 py-3 pl-4 pr-12 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm text-gray-700 max-h-24 min-h-[50px]"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${!input.trim() || isLoading
                            ? "text-gray-300"
                            : "text-indigo-600 hover:bg-indigo-50"
                            }`}
                    >
                        <FontAwesomeIcon icon="paper-plane" />
                    </button>
                </div>
            </div>
        </div>
    );
}
