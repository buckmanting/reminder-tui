import {describe, it, expect} from 'vitest';
import {formatDueDate, parseTags} from './useReminders.js';

describe('formatDueDate', () => {
	it('returns "today" when dueDate equals today', () => {
		expect(formatDueDate('2026-05-19', '2026-05-19')).toBe('today');
	});

	it('returns "overdue" when dueDate is in the past', () => {
		expect(formatDueDate('2026-05-01', '2026-05-19')).toBe('overdue');
	});

	it('returns the date string when due in the future', () => {
		expect(formatDueDate('2026-06-01', '2026-05-19')).toBe('2026-06-01');
	});
});

describe('parseTags', () => {
	it('splits comma-separated tags and trims whitespace', () => {
		expect(parseTags('work, urgent, health')).toEqual([
			'work',
			'urgent',
			'health',
		]);
	});

	it('returns empty array for undefined', () => {
		expect(parseTags(undefined)).toEqual([]);
	});

	it('returns empty array for empty string', () => {
		expect(parseTags('')).toEqual([]);
	});

	it('filters out blank entries from trailing commas', () => {
		expect(parseTags('work,')).toEqual(['work']);
	});
});
