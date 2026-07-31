import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Shared empty-state panel.
 *
 * Covers the identical gradient/icon/title/description/CTA shell duplicated
 * across Dashboard ("Get Started"), ProjectView ("No recordings yet") and
 * TrendCharts ("Not enough data yet").
 *
 * - `icon`: FontAwesome icon name rendered large and indigo above the title.
 * - `title` / `description`: the copy.
 * - `children`: optional CTA row. When present the description gets bottom
 *   margin to separate it from the CTAs (matching Dashboard/ProjectView);
 *   when absent it doesn't (matching TrendCharts, which has no CTA).
 */
const EmptyState = ({ icon, title, description, className = '', children }) => {
    return (
        <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 shadow-sm text-center ${className}`}>
            <div className="text-indigo-500 text-6xl mb-4">
                <FontAwesomeIcon icon={icon} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            {description && (
                <p className={`text-gray-600 ${children ? 'mb-6' : ''}`}>{description}</p>
            )}
            {children && (
                <div className="flex gap-3 justify-center">{children}</div>
            )}
        </div>
    );
};

export default EmptyState;
