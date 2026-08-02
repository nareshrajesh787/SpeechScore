import React from 'react';

// Static class maps -- Tailwind's JIT scanner only picks up literal class
// strings it can see in source, so a template-interpolated `stroke-${tone}-500`
// would silently produce no CSS at build time. `tone` must index into this map.
const TONE_CLASSES = {
    brand: { stroke: 'stroke-brand-500', fill: 'fill-brand-500/10', dot: 'fill-brand-600' },
    accent: { stroke: 'stroke-accent-500', fill: 'fill-accent-500/15', dot: 'fill-accent-600' },
};

/**
 * A minimal inline trend line -- no axes, no grid, just the shape of the data.
 * Used where a full Recharts chart would be overkill (a project card in a grid).
 *
 * `tone` is deliberately just `'brand' | 'accent'`, not the full good/caution/
 * needs-work palette: this draws a whole history's shape, not a single
 * reading, so per-point severity coloring doesn't apply. `accent` (gold) is
 * reserved for genuine improvement -- pass it only when the series' last
 * value is actually higher than its first, never as a decorative choice.
 */
const Sparkline = ({ values = [], height = 28, tone = 'brand', className = '' }) => {
    const clean = values.filter((v) => Number.isFinite(v));
    if (clean.length < 2) return null;

    const width = 100; // viewBox units; actual rendered size is controlled by CSS via `className`/`height`.
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const range = max - min || 1; // flat series (all equal values) would divide by zero otherwise.

    const points = clean.map((v, i) => {
        const x = (i / (clean.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return [x, y];
    });

    const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
    const [lastX, lastY] = points[points.length - 1];
    const classes = TONE_CLASSES[tone] || TONE_CLASSES.brand;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className={`w-full ${className}`}
            style={{ height }}
            role="img"
            aria-hidden="true"
        >
            <path d={areaPath} className={classes.fill} stroke="none" />
            <path
                d={linePath}
                className={classes.stroke}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <circle cx={lastX} cy={lastY} r={2.5} className={classes.dot} />
        </svg>
    );
};

export default Sparkline;
