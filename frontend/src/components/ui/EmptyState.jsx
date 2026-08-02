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
    // A blank page rather than a colored panel: an empty state should read as
    // "nothing here yet", and a saturated surface competes with the real
    // content elsewhere on the page.
    return (
        <div className={`bg-gradient-to-br from-paper-50 to-paper-200 border border-paper-300 rounded-2xl p-12 shadow-card text-center ${className}`}>
            <div className="text-paper-500 text-5xl mb-4">
                <FontAwesomeIcon icon={icon} />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink-800 mb-2">{title}</h3>
            {description && (
                <p className={`text-ink-600 ${children ? 'mb-6' : ''}`}>{description}</p>
            )}
            {children && (
                <div className="flex gap-3 justify-center">{children}</div>
            )}
        </div>
    );
};

export default EmptyState;
