/**
 * Formats a Date as a short relative string ("Just now", "5m ago", "3d ago"),
 * falling back to an absolute short date once it's no longer recent enough
 * for "N units ago" to be useful at a glance.
 */
export function formatRelativeDate(date) {
    if (!date) return '';

    const diffMs = Date.now() - date.getTime();
    // Clock skew / future timestamps: an absolute date is less misleading
    // than a negative "ago" value.
    if (diffMs < 0) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
