import React from 'react';
import {Box, Text} from 'ink';
import type {Reminder} from '../types.js';
import ReminderItem from './ReminderItem.js';

const sidebarWidth = 28;

type Props = {
	readonly reminders: Reminder[];
	readonly today: string;
};

export default function ReminderList({reminders, today}: Props) {
	return (
		<Box
			flexDirection="column"
			width={sidebarWidth}
			borderStyle="round"
			borderColor="gray"
			paddingX={1}
		>
			<Text bold color="cyan">
				Reminders
			</Text>
			<Box flexDirection="column" marginTop={1} flexGrow={1}>
				{reminders.length === 0 ? (
					<Text dimColor color="gray">
						None yet
					</Text>
				) : (
					reminders.map(r => (
						<ReminderItem key={r.id} reminder={r} today={today} />
					))
				)}
			</Box>
		</Box>
	);
}
