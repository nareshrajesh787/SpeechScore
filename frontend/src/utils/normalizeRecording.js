/**
 * Shared shape-tolerance helpers for recording/result documents.
 *
 * The backend's Firestore documents have evolved over time (see AnalyzeResponse
 * in backend/schemas.py for the current shape), but old documents already
 * written to Firestore keep whatever shape they were written with. These
 * helpers centralize the "which shape is this" detection that was previously
 * duplicated across RecordingCard.jsx and ResultPanel.jsx.
 */

/**
 * Normalizes AI feedback strengths/improvements, tolerating older documents
 * that stored these as top-level fields instead of nested under ai_feedback.
 */
export function getAiFeedback(recording) {
    const rawStrengths = recording?.ai_feedback?.strengths ?? recording?.strengths ?? [];
    const rawImprovements = recording?.ai_feedback?.improvements ?? recording?.improvements ?? [];
    return {
        strengths: Array.isArray(rawStrengths) ? rawStrengths : [],
        improvements: Array.isArray(rawImprovements) ? rawImprovements : [],
    };
}

/**
 * Normalizes filler_count into a single total, tolerating older documents
 * that stored a bare total instead of a {word: count} breakdown.
 * Returns null if no usable value is present.
 */
export function getFillerTotal(fillerCount) {
    if (typeof fillerCount === 'object' && fillerCount !== null) {
        return Object.values(fillerCount).reduce((sum, count) => sum + count, 0);
    }
    if (typeof fillerCount === 'number') {
        return fillerCount;
    }
    return null;
}

/**
 * Normalizes a rubric_scores map into a list of {criterion, score, max}
 * entries, tolerating older documents that stored a bare numeric score
 * instead of a {score, max_score} object.
 */
export function getRubricScoreEntries(rubricScores) {
    if (!rubricScores || typeof rubricScores !== 'object') return [];
    return Object.entries(rubricScores).map(([criterion, value]) => {
        if (typeof value === 'object' && value !== null && 'score' in value) {
            return { criterion, score: value.score, max: value.max_score };
        }
        // Legacy format: bare numeric score, no known max.
        return { criterion, score: value, max: 5 };
    });
}
