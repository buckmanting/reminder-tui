import {useEffect, useRef} from 'react';
import {Agent, maxTurns, type ToolDefinition, type Gemma} from '@kessler/gemma';
import type {Reminder} from '../types.js';
import {parseTags} from './useReminders.js';

export const toolName = {
	addReminder: 'add_reminder',
	getReminders: 'get_reminders',
	completeReminder: 'complete_reminder',
} as const;

export const buildSystemPrompt = (todayDate: string) =>
	`You are a focused reminder assistant. Today is ${todayDate}.

Your primary goal is to build a comprehensive list of reminders for the user. For each reminder you must collect ALL of the following before calling ${toolName.addReminder}:
- description: a clear, specific description of what needs to be done
- dueDate: the exact due date (YYYY-MM-DD) — always ask if not provided
- tags: at least one category tag (e.g. work, personal, health, finance, urgent)

Do not call ${toolName.addReminder} until you have all three fields. Ask follow-up questions to fill any gaps. Once you have all fields for a reminder, call ${toolName.addReminder} immediately, then continue gathering the next one.

Proactively ask about deadlines, appointments, recurring tasks, bills, and personal commitments. Keep asking until you have a complete picture of what the user needs to track.

When the user asks to see reminders or asks what is due, call ${toolName.getReminders} first, then present the relevant ones clearly.
When the user asks to mark a reminder done, call ${toolName.completeReminder} with the description.
When the user asks about today's tasks, call ${toolName.getReminders} and present them ordered by priority.`;

export function buildTools(
	remindersRef: React.RefObject<Reminder[]>,
	addReminder: (
		description: string,
		dueDate: string,
		tags: string[],
	) => Reminder,
	completeReminder: (descriptionFragment: string) => Reminder | undefined,
): ToolDefinition[] {
	return [
		{
			name: toolName.addReminder,
			description: 'Add a single reminder to the list. Call once per reminder.',
			parameters: {
				type: 'object',
				properties: {
					description: {type: 'string', description: 'What needs to be done'},
					dueDate: {
						type: 'string',
						description: 'Due date in YYYY-MM-DD format',
					},
					tags: {
						type: 'string',
						description: 'Comma-separated tags, e.g. "work,urgent"',
					},
				},
				required: ['description', 'dueDate'],
			},
			async execute(args) {
				addReminder(
					String(args.description),
					String(args.dueDate),
					parseTags(args.tags as string | undefined),
				);
				return {success: true};
			},
		},
		{
			name: toolName.getReminders,
			description:
				'Get the full list of reminders. Call this before answering any question about reminders.',
			async execute() {
				const list = remindersRef.current;
				if (list.length === 0) return {result: 'No reminders yet.'};
				const lines = list.map(
					(r, i) =>
						`${i + 1}. [${r.complete ? 'DONE' : 'TODO'}] ${
							r.description
						} | due: ${r.dueDate} | tags: ${r.tags.join(', ') || 'none'}`,
				);
				return {result: lines.join('\n')};
			},
		},
		{
			name: toolName.completeReminder,
			description: 'Mark a reminder as complete by its description.',
			parameters: {
				type: 'object',
				properties: {
					description: {
						type: 'string',
						description:
							'The description (or part of it) of the reminder to mark done',
					},
				},
				required: ['description'],
			},
			async execute(args) {
				const match = completeReminder(String(args.description));
				if (!match)
					return {
						success: false,
						error: 'No matching incomplete reminder found',
					};
				return {success: true, completed: match.description};
			},
		},
	];
}

type UseAgentOptions = {
	gemma: Gemma | undefined;
	isLoaded: boolean;
	todayDate: string;
	remindersRef: React.RefObject<Reminder[]>;
	addReminder: (
		description: string,
		dueDate: string,
		tags: string[],
	) => Reminder;
	completeReminder: (descriptionFragment: string) => Reminder | undefined;
	onChunk: (text: string) => void;
};

export const useAgent = ({
	gemma,
	isLoaded,
	todayDate,
	remindersRef,
	addReminder,
	completeReminder,
	onChunk,
}: UseAgentOptions) => {
	const agentRef = useRef<Agent>();
	const onChunkRef = useRef(onChunk);
	onChunkRef.current = onChunk;

	useEffect(() => {
		if (!isLoaded || !gemma) return;
		agentRef.current = new Agent({
			model: gemma,
			systemPrompt: buildSystemPrompt(todayDate),
			tools: buildTools(remindersRef, addReminder, completeReminder),
			historyStrategy: maxTurns(20),
			onChunk(text) {
				onChunkRef.current(text);
			},
		});
	}, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps -- agent is intentionally created once when the model loads

	const run = async (prompt: string) => {
		if (!agentRef.current) throw new Error('Agent not ready');
		return agentRef.current.run(prompt);
	};

	return {run, isReady: Boolean(agentRef.current)};
};
