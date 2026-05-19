import {useMemo, useRef, useState} from 'react';
import type {Reminder} from '../types.js';

export const today = () => new Date().toISOString().split('T')[0]!;

export function formatDueDate(dueDate: string, todayDate: string): string {
	if (dueDate === todayDate) return 'today';
	if (dueDate < todayDate) return 'overdue';
	return dueDate;
}

export function parseTags(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map(t => t.trim())
		.filter(Boolean);
}

export const useReminders = () => {
	const [reminders, setReminders] = useState<Reminder[]>([]);
	const remindersRef = useRef<Reminder[]>(reminders);
	remindersRef.current = reminders;

	const sorted = useMemo(
		() => [...reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
		[reminders],
	);

	const addReminder = (
		description: string,
		dueDate: string,
		tags: string[],
	): Reminder => {
		const reminder: Reminder = {
			id: crypto.randomUUID(),
			description,
			complete: false,
			dueDate,
			tags,
		};
		setReminders(previous => [...previous, reminder]);
		return reminder;
	};

	const completeReminder = (
		descriptionFragment: string,
	): Reminder | undefined => {
		const target = descriptionFragment.toLowerCase();
		const match = remindersRef.current.find(
			r => !r.complete && r.description.toLowerCase().includes(target),
		);
		if (!match) return undefined;
		setReminders(previous =>
			previous.map(r => (r.id === match.id ? {...r, complete: true} : r)),
		);
		return match;
	};

	return {reminders, remindersRef, sorted, addReminder, completeReminder};
};
