import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
            draft: index + 1
        };
    });

    // Custom tooltip styled to match Card component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white rounded-xl shadow-md border border-indigo-50/50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
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
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-12 shadow-sm text-center">
                <div className="text-indigo-500 text-6xl mb-4">
                    <FontAwesomeIcon icon="chart-line" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Not enough data yet</h3>
                <p className="text-gray-600">
                    Record more drafts to see your progress trends over time.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* WPM Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-50/50 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="gauge" className="text-indigo-600" />
                        Words Per Minute (WPM)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Ideal range: 130-150 WPM (highlighted in green)
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
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
                            stroke="#4f46e5"
                            strokeWidth={2}
                            dot={{ fill: '#4f46e5', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Filler Words Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-50/50 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="wand-magic-sparkles" className="text-red-500" />
                        Filler Words Count
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Total filler words per recording
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            label={{ value: 'Fillers', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="fillers"
                            fill="#dc2626"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Clarity Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-50/50 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <FontAwesomeIcon icon="star" className="text-indigo-600" />
                        Clarity Score
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Speech clarity score (0-100 scale)
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            domain={[0, 100]}
                            label={{ value: 'Clarity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="clarity"
                            stroke="#4f46e5"
                            strokeWidth={2}
                            dot={{ fill: '#4f46e5', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
