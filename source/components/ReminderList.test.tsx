import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import type {Reminder} from '../types.js';
import ReminderList from './ReminderList.js';

const reminder: Reminder = {
	id: '1',
	description: 'Buy milk',
	complete: false,
	dueDate: '2026-05-20',
	tags: ['personal'],
};

describe('ReminderList', () => {
	it('shows "None yet" when empty', () => {
		const {lastFrame} = render(
			<ReminderList reminders={[]} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('None yet');
	});

	it('renders a reminder description', () => {
		const {lastFrame} = render(
			<ReminderList reminders={[reminder]} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('Buy milk');
	});

	it('renders multiple reminders', () => {
		const second: Reminder = {
			...reminder,
			id: '2',
			description: 'Call dentist',
		};
		const {lastFrame} = render(
			<ReminderList reminders={[reminder, second]} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('Buy milk');
		expect(lastFrame()).toContain('Call dentist');
	});

	it('shows the "Reminders" heading', () => {
		const {lastFrame} = render(
			<ReminderList reminders={[]} today="2026-05-19" />,
		);
		expect(lastFrame()).toContain('Reminders');
	});
});
