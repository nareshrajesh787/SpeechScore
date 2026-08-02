import React from 'react';

/**
 * Draft-over-draft change chip.
 *
 * SpeechScore's whole promise is "record draft 1, get feedback, record draft 2,
 * see how you improve" -- this is the component that finally makes that visible.
 *
 * Two rules drive the design:
 *
 * 1. The ARROW reflects the direction the number moved, never whether that move
 *    was good. Fillers dropping 20 -> 11 is an improvement and still gets a DOWN
 *    arrow, because the number went down. COLOR carries good/bad. Inverting the
 *    arrow to "point up when good" makes the chip lie about the data.
 * 2. Gold (`accent`) is the design system's scarce progress color. This chip is
 *    the primary sanctioned place it appears, and only ever on an improvement.
 *
 * Zero-delta choice: renders the literal words "no change" in a neutral
 * paper/ink chip with no arrow and no +/- sign. A bare "0" reads ambiguously
 * next to signed values (is it a rounded +0.4?), and the words survive being
 * seen with no color at all.
 *
 * Accessibility: meaning is never color-only. The chip carries a visually
 * hidden description ("improved by 3") plus a matching `title`, and the visible
 * text itself is explicitly signed, so the arrow glyph is never the sole signal.
 */
const DeltaBadge = ({
    current,
    previous,
    lowerIsBetter = false,
    precision = 0,
    label,
    className = '',
}) => {
    // First draft has no baseline to compare against -- render nothing rather
    // than an empty chip. Also covers null/NaN/Infinity from partial metrics.
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;

    // Round once, up front, and decide everything from the rounded value. If we
    // branched on the raw delta a -0.004 change at precision 0 would render as
    // a clay "-0" regression, which is noise dressed up as a signal.
    const delta = Number((current - previous).toFixed(precision));
    const isZero = delta === 0;
    const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;

    const magnitude = Math.abs(delta).toFixed(precision);
    const sign = delta > 0 ? '+' : '-';
    const arrow = delta > 0 ? '↑' : '↓';

    const tones = {
        improved: 'bg-accent-50 text-accent-700 border-accent-200',
        declined: 'bg-needs-work-50 text-needs-work-700 border-needs-work-200',
        neutral: 'bg-paper-200 text-ink-500 border-paper-300',
    };
    const tone = isZero ? tones.neutral : (isImprovement ? tones.improved : tones.declined);

    const description = isZero
        ? 'no change'
        : `${isImprovement ? 'improved' : 'declined'} by ${magnitude}`;
    const fullDescription = label ? `${description} ${label}` : description;

    const baseStyles = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold leading-none';

    return (
        <span className={`${baseStyles} ${tone} ${className}`} title={fullDescription}>
            {!isZero && (
                <span aria-hidden="true" className="text-[0.9em] leading-none">{arrow}</span>
            )}
            {/* font-display + tabular-nums: these numerals get count-up animated
                later and must not jitter as digits change width. */}
            <span aria-hidden="true" className="font-display tabular-nums">
                {isZero ? 'no change' : `${sign}${magnitude}`}
            </span>
            {label && (
                <span aria-hidden="true" className="font-sans font-normal opacity-75">{label}</span>
            )}
            <span className="sr-only">{fullDescription}</span>
        </span>
    );
};

export default DeltaBadge;
