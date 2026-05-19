import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import type {Reminder} from '../types.js';
import ReminderItem from './ReminderItem.js';

const base: Reminder = {
	id: '1',
	description: 'Write tests',
	complete: false,
	dueDate: '2026-06-01',
	tags: ['work'],
};

describe('ReminderItem', () => {
	it('renders description', () => {
		const {lastFrame} = render(
			<ReminderItem reminder={base} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('Write tests');
	});

	it('shows ○ for incomplete reminders', () => {
		const {lastFrame} = render(
			<ReminderItem reminder={base} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('○');
	});

	it('shows ✓ for complete reminders', () => {
		const {lastFrame} = render(
			<ReminderItem reminder={{...base, complete: true}} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('✓');
	});

	it('shows "today" when due today', () => {
		const {lastFrame} = render(
			<ReminderItem
				reminder={{...base, dueDate: '2026-05-19'}}
				today="2026-05-19"
			/>,
		);
		expect(lastFrame()).toContain('today');
	});

	it('shows "overdue" when past due', () => {
		const {lastFrame} = render(
			<ReminderItem
				reminder={{...base, dueDate: '2026-05-01'}}
				today="2026-05-19"
			/>,
		);
		expect(lastFrame()).toContain('overdue');
	});

	it('renders tags', () => {
		const {lastFrame} = render(
			<ReminderItem reminder={base} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('work');
	});

	it('omits tag separator when no tags', () => {
		const {lastFrame} = render(
			<ReminderItem reminder={{...base, tags: []}} today="2026-05-19" />,
		);
		expect(lastFrame()).not.toContain('·');
	});
});
