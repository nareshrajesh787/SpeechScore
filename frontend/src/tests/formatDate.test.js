import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeDate } from '../utils/formatDate';

describe('formatRelativeDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-28T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns an empty string for a missing date', () => {
        expect(formatRelativeDate(null)).toBe('');
        expect(formatRelativeDate(undefined)).toBe('');
    });

    it('shows "Just now" for the last minute', () => {
        expect(formatRelativeDate(new Date('2026-07-28T11:59:45Z'))).toBe('Just now');
    });

    it('shows minutes ago within the last hour', () => {
        expect(formatRelativeDate(new Date('2026-07-28T11:45:00Z'))).toBe('15m ago');
    });

    it('shows hours ago within the last day', () => {
        expect(formatRelativeDate(new Date('2026-07-28T06:00:00Z'))).toBe('6h ago');
    });

    it('shows days ago within the last week', () => {
        expect(formatRelativeDate(new Date('2026-07-25T12:00:00Z'))).toBe('3d ago');
    });

    it('falls back to an absolute short date past a week', () => {
        expect(formatRelativeDate(new Date('2026-07-01T12:00:00Z'))).toBe('Jul 1');
    });

    // Regression guard: a future/skewed timestamp must not render as a
    // nonsensical negative "ago" value.
    it('falls back to an absolute date for a future timestamp', () => {
        expect(formatRelativeDate(new Date('2026-08-05T12:00:00Z'))).toBe('Aug 5');
    });
});
