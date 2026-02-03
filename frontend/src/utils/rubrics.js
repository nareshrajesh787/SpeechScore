/**
 * Rubric Presets for different speech scenarios
 * Each preset provides detailed evaluation criteria for AI analysis
 */
export const RUBRIC_PRESETS = {
    'General Speaking': `Evaluate based on clarity, steady pacing (around 130–150 wpm), minimal filler words, and a clear beginning, middle, and end.`,

    'Job Interview': `Focus on STAR method (Situation, Task, Action, Result), confidence, concise answers, professional vocabulary, and flag rambling or hesitation.`,

    'Sales Pitch': `Focus on energy and persuasion, a strong hook, clear problem/solution structure, and an explicit call to action.`,

    'Debate / Argument': `Focus on logical flow, authoritative tone, avoiding weak language ("I think", "maybe"), and clear, supported arguments.`,

    'Storytelling': `Focus on narrative arc, vivid vocabulary, emotional engagement, and pacing variation to build suspense.`,

    'Custom': ``
};

export const getRubricPreset = (key) => {
    return RUBRIC_PRESETS[key] || RUBRIC_PRESETS['General Speaking'];
};
