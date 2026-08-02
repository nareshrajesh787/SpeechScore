import {
    LineChart,
    Line,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

// Mirrors the threshold logic in `ui/Metric.jsx`'s `getMetricTone('fillers', value,
// { durationSeconds })` so the trend chart and the metric tiles elsewhere in the app
// always agree on what counts as good/caution/needs-work. Kept local (not imported)
// because that file is component-focused and this is a chart concern.
function fillerBarColor({ fillers, durationSeconds }) {
    // Fillers-per-minute when duration is known; otherwise fall back to the raw
    // count. The fallback is length-dependent (a long recording will look worse
    // than it is) but matches the same caveat used by getMetricTone.
    const rate = Number.isFinite(durationSeconds) && durationSeconds > 0
        ? fillers / (durationSeconds / 60)
        : fillers;

    if (rate <= 3) return '#5C8A6A'; // good-500
    if (rate <= 8) return '#C6952F'; // caution-500
    return '#C26550'; // needs-work-500
}

export default function TrendCharts({ recordings }) {
    // Transform recordings data for charts
    // Sort by createdAt ascending for chronological order
    const sortedRecordings = [...recordings].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateA - dateB;
    });

    // Format data for charts
    const chartData = sortedRecordings.map((recording, index) => {
        const date = recording.createdAt?.toDate
            ? recording.createdAt.toDate()
            : new Date(recording.createdAt || Date.now());

        const totalFillers = recording.filler_count
            ? Object.values(recording.filler_count).reduce((a, b) => a + b, 0)
            : 0;

        return {
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // "Oct 12"
            fullDate: date,
            wpm: recording.wpm || 0,
            fillers: totalFillers,
            clarity: recording.clarity_score || 0,
            durationSeconds: recording.audio_duration,
            draft: index + 1
        };
    });

    // Custom tooltip styled to match Card component
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            const dateLabel = point.fullDate instanceof Date
                ? point.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : null;
            const header = dateLabel ? `Draft ${point.draft} · ${dateLabel}` : `Draft ${point.draft}`;

            return (
                <div className="bg-white rounded-xl shadow-md border border-brand-50/50 p-4">
                    <p className="text-sm font-semibold text-ink-800 mb-2">{header}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (chartData.length < 2) {
        return (
            <EmptyState
                icon="chart-line"
                title="Not enough data yet"
                description="Record more drafts to see your progress trends over time."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* WPM Chart */}
            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-ink-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="gauge" className="text-brand-600" />
                        Words Per Minute (WPM)
                    </h3>
                    <p className="text-xs text-paper-500 mt-1">
                        Ideal range: 130-150 WPM (highlighted in green)
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                        <XAxis
                            dataKey="draft"
                            tickFormatter={(value) => `Draft ${value}`}
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                            domain={[
                                (dataMin) => Math.max(0, Math.floor(dataMin / 10) * 10 - 10),
                                (dataMax) => Math.ceil(dataMax / 10) * 10 + 10
                            ]}
                            label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4E5566' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceArea
                            y1={130}
                            y2={150}
                            fill="#10b981"
                            fillOpacity={0.15}
                            stroke="none"
                            ifOverflow="extendDomain"
                        />
                        <ReferenceLine
                            y={130}
                            stroke="#10b981"
                            strokeDasharray="3 3"
                            strokeWidth={1.5}
                            strokeOpacity={0.6}
                        />
                        <ReferenceLine
                            y={150}
                            stroke="#10b981"
                            strokeDasharray="3 3"
                            strokeWidth={1.5}
                            strokeOpacity={0.6}
                        />
                        <Line
                            type="monotone"
                            dataKey="wpm"
                            stroke="#3F51B0"
                            strokeWidth={2}
                            dot={{ fill: '#3F51B0', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Filler Words Chart */}
            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-ink-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="comment-slash" className="text-brand-600" />
                        Filler Words Count
                    </h3>
                    <p className="text-xs text-paper-500 mt-1">
                        Total filler words per recording
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                        <XAxis
                            dataKey="draft"
                            tickFormatter={(value) => `Draft ${value}`}
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                            label={{ value: 'Fillers', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4E5566' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="fillers"
                            fill="#3F51B0"
                            radius={[8, 8, 0, 0]}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`filler-cell-${index}`} fill={fillerBarColor(entry)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Clarity Chart */}
            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-ink-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="star" className="text-brand-600" />
                        Clarity Score
                    </h3>
                    <p className="text-xs text-paper-500 mt-1">
                        Speech clarity score (0-10 scale)
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                        <XAxis
                            dataKey="draft"
                            tickFormatter={(value) => `Draft ${value}`}
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#4E5566"
                            style={{ fontSize: '12px' }}
                            domain={[
                                (dataMin) => Math.max(0, Math.floor(dataMin) - 1),
                                (dataMax) => Math.min(10, Math.ceil(dataMax) + 1)
                            ]}
                            label={{ value: 'Clarity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4E5566' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="clarity"
                            stroke="#3F51B0"
                            strokeWidth={2}
                            dot={{ fill: '#3F51B0', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}
