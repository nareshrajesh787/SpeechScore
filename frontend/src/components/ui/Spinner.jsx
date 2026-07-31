import React from 'react';

const SIZE_CLASSES = {
    sm: 'h-8 w-8',
    lg: 'h-12 w-12',
};

/**
 * Shared loading spinner.
 *
 * Covers both the bare spinning icon and the "centered icon + label" shape
 * duplicated across SpeechAnalyzerPage, Dashboard, ProjectView and ResultPanel.
 *
 * - `size`: 'sm' -> h-8 w-8 (ResultPanel), 'lg' -> h-12 w-12 (the other three).
 * - `fullScreen`: true renders the full-page `min-h-screen` wrapper used by
 *   SpeechAnalyzerPage/Dashboard/ProjectView; false (default) renders the
 *   contained `flex items-center justify-center` wrapper used by ResultPanel,
 *   which supplies its own outer sizing/background/padding via `className`.
 * - `label`: optional caption below the icon. Omit to render just the icon.
 */
const Spinner = ({ size = 'lg', label, fullScreen = false, className = '', ...props }) => {
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.lg;

    const wrapperClass = fullScreen
        ? 'bg-zinc-50 min-h-screen flex items-center justify-center'
        : 'flex items-center justify-center';

    return (
        <div className={`${wrapperClass} ${className}`} data-testid="spinner" {...props}>
            <div className="text-center">
                <div
                    className={`inline-block animate-spin rounded-full ${sizeClass} border-b-2 border-indigo-600 mb-4`}
                    data-testid="spinner-icon"
                ></div>
                {label && <p className="text-gray-600 font-medium">{label}</p>}
            </div>
        </div>
    );
};

export default Spinner;
