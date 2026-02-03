/**
 * Centralized configuration for the application.
 * 
 * VITE_API_URL should be set in .env.production (for Vercel) and .env.development (for local).
 * If not set, it falls back to localhost.
 */

const getApiUrl = () => {
    // Ensure we don't have double slashes at the end
    const url = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

    // Ensure protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
    }

    return url;
};

export const API_URL = getApiUrl();
