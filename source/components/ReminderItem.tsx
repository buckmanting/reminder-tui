import React from 'react';
import {Box, Text} from 'ink';
import type {Reminder} from '../types.js';
import {formatDueDate} from '../hooks/useReminders.js';

type Props = {
	readonly reminder: Reminder;
	readonly today: string;
};

export default function ReminderItem({reminder, today}: Props) {
	const status = formatDueDate(reminder.dueDate, today);
	const color = reminder.complete
		? 'gray'
		: status === 'overdue'
		? 'red'
		: status === 'today'
		? 'yellow'
		: 'white';

	return (
		<Box flexDirection="column">
			<Text dimColor={reminder.complete} color={color}>
				{reminder.complete ? '✓' : '○'} {reminder.description}
			</Text>
			<Text dimColor color="gray">
				{'  '}
				{formatDueDate(reminder.dueDate, today)}
				{reminder.tags.length > 0 ? ` · ${reminder.tags.join(', ')}` : ''}
			</Text>
		</Box>
	);
}
