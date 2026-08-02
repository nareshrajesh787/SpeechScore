import React from 'react';

/**
 * A single metric tile that derives a semantic tone from its own value.
 *
 * The problem this solves: every metric on a recording card used to render as
 * the same indigo number, so `182 WPM` (much too fast) looked identical to
 * `149 WPM` (ideal). Here the value's color, and an accompanying words-only
 * description, say whether the number is actually good.
 *
 * `accent` (gold) is deliberately NOT used — it is reserved for progress and
 * achievement, not for standing measurements.
 */

const TONE_STYLES = {
    good: {
        tile: 'bg-good-50 border-good-200',
        value: 'text-good-700',
    },
    caution: {
        tile: 'bg-caution-50 border-caution-200',
        value: 'text-caution-700',
    },
    'needs-work': {
        tile: 'bg-needs-work-50 border-needs-work-200',
        value: 'text-needs-work-700',
    },
    // Neutral is "we have no reading", not "this is fine" — so it stays on the
    // paper/ink neutrals rather than borrowing a semantic color.
    neutral: {
        tile: 'bg-paper-200 border-paper-300',
        value: 'text-ink-700',
    },
};

/**
 * Derive a metric's tone from its value.
 *
 * @param {'wpm'|'fillers'|'clarity'|'rubric'} type
 * @param {number|null|undefined} value
 * @param {{ max?: number, durationSeconds?: number }} [options]
 * @returns {'good'|'caution'|'needs-work'|'neutral'}
 */
export const getMetricTone = (type, value, { max, durationSeconds } = {}) => {
    // Covers null, undefined, NaN, Infinity, and non-numeric values.
    if (!Number.isFinite(value)) return 'neutral';

    switch (type) {
        // Ideal band matches the reference band drawn in TrendCharts (130-150).
        case 'wpm': {
            if (value >= 130 && value <= 150) return 'good';
            if ((value >= 115 && value < 130) || (value > 150 && value <= 170)) return 'caution';
            return 'needs-work';
        }

        case 'fillers': {
            // Fillers are only meaningful as a *rate*: 10 fillers in a 10-minute
            // talk is clean, 10 in a 1-minute talk is not. When we know the
            // duration we normalize to fillers-per-minute.
            //
            // CAVEAT: without a duration we fall back to scoring the raw total
            // against the same thresholds. That is length-dependent and
            // therefore much less meaningful — a long recording will look worse
            // than it is. Pass `durationSeconds` whenever it is available.
            const rate = (Number.isFinite(durationSeconds) && durationSeconds > 0)
                ? value / (durationSeconds / 60)
                : value;

            if (rate <= 3) return 'good';
            if (rate <= 8) return 'caution';
            return 'needs-work';
        }

        // 0-10 scale.
        case 'clarity': {
            if (value >= 7.5) return 'good';
            if (value >= 5) return 'caution';
            return 'needs-work';
        }

        // Scored as a percentage of the rubric's own maximum, since rubric
        // maximums differ per preset. Without a usable max there is no
        // percentage to compute, so the tile stays neutral rather than guessing.
        case 'rubric': {
            if (!Number.isFinite(max) || max <= 0) return 'neutral';
            const pct = value / max;
            if (pct >= 0.75) return 'good';
            if (pct >= 0.5) return 'caution';
            return 'needs-work';
        }

        default:
            return 'neutral';
    }
};

/**
 * Words for the tone, so the meaning is not carried by color alone. WPM gets a
 * directional phrasing ("slightly fast" vs "slightly slow") because for pace
 * the direction of the miss is the actionable part.
 */
const describeTone = (type, tone, value) => {
    if (tone === 'neutral') return 'not measured';

    if (type === 'wpm') {
        if (tone === 'good') return 'on target';
        if (tone === 'caution') return value < 130 ? 'slightly slow' : 'slightly fast';
        return value < 115 ? 'much too slow' : 'much too fast';
    }

    if (type === 'fillers') {
        if (tone === 'good') return 'on target';
        if (tone === 'caution') return 'a little frequent';
        return 'needs work';
    }

    if (tone === 'good') return 'on target';
    if (tone === 'caution') return 'room to improve';
    return 'needs work';
};

const Metric = ({ label, value, type, max, durationSeconds, className = '', ...props }) => {
    const tone = getMetricTone(type, value, { max, durationSeconds });
    const styles = TONE_STYLES[tone] || TONE_STYLES.neutral;
    const description = describeTone(type, tone, value);

    const hasValue = Number.isFinite(value);
    let display = '—'; // em dash
    if (hasValue) {
        display = (type === 'rubric' && Number.isFinite(max)) ? `${value}/${max}` : `${value}`;
    }

    return (
        <div
            className={`rounded-xl border p-3 ${styles.tile} ${className}`}
            title={`${label}: ${display} — ${description}`}
            {...props}
        >
            <p className="text-xs text-ink-600">{label}</p>
            {/* `tabular-nums` keeps digit widths fixed so these values can be
                count-up animated later without the tile jittering. */}
            <p className={`font-display text-xl tabular-nums ${styles.value}`}>{display}</p>
            <span className="sr-only">{description}</span>
        </div>
    );
};

export default Metric;
