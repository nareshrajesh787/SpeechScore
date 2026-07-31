import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Shared tab switcher.
 *
 * Standardized on the visual language used by SpeechAnalyzerPage's
 * Upload/Studio toggle and ProjectView's Recordings/Trends toggle
 * (bg-gray-100 rounded-xl container, solid bg-indigo-600 text-white active
 * state) since it's already used in 2 of the 3 existing tab implementations.
 *
 * ResultPanel's Transcript/Ask Coach toggle differs only in *width*
 * behavior (`w-fit` instead of equally-shared `flex-1` tabs), not color, so
 * that's exposed via `fullWidth` rather than forking the color language too.
 *
 * - `fullWidth` (default true): tabs share width equally via `flex-1`,
 *   matching SpeechAnalyzerPage/ProjectView.
 * - `fullWidth={false}`: container shrinks to `w-fit` and tabs size to their
 *   content, matching ResultPanel's layout.
 */
const Tabs = ({ tabs, activeTab, onChange, fullWidth = true, className = '' }) => {
    return (
        <div className={`flex gap-2 p-1 bg-gray-100 rounded-xl ${fullWidth ? '' : 'w-fit'} ${className}`}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`${fullWidth ? 'flex-1' : ''} py-2 px-4 rounded-lg font-semibold transition ${isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab.icon && <FontAwesomeIcon icon={tab.icon} className="mr-2" />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
