import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {Agent, maxTurns} from '@kessler/gemma';
import type {ToolDefinition} from '@kessler/gemma';
import {useModel} from './useModel.js';
import type {Reminder} from './types.js';

const SIDEBAR_WIDTH = 28;

const TOOL = {
	addReminder: 'add_reminder',
	getReminders: 'get_reminders',
	completeReminder: 'complete_reminder',
} as const;

const buildSystemPrompt = (today: string) => `You are a focused reminder assistant. Today is ${today}.

Your primary goal is to build a comprehensive list of reminders for the user. For each reminder you must collect ALL of the following before calling ${TOOL.addReminder}:
- description: a clear, specific description of what needs to be done
- dueDate: the exact due date (YYYY-MM-DD) — always ask if not provided
- tags: at least one category tag (e.g. work, personal, health, finance, urgent)

Do not call ${TOOL.addReminder} until you have all three fields. Ask follow-up questions to fill any gaps. Once you have all fields for a reminder, call ${TOOL.addReminder} immediately, then continue gathering the next one.

Proactively ask about deadlines, appointments, recurring tasks, bills, and personal commitments. Keep asking until you have a complete picture of what the user needs to track.

When the user asks to see reminders or asks what is due, call ${TOOL.getReminders} first, then present the relevant ones clearly.
When the user asks to mark a reminder done, call ${TOOL.completeReminder} with the description.
When the user asks about today's tasks, call ${TOOL.getReminders} and present them ordered by priority.`;

function buildTools(
	remindersRef: React.RefObject<Reminder[]>,
	setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
): ToolDefinition[] {
	return [
		{
			name: TOOL.addReminder,
			description: 'Add a single reminder to the list. Call once per reminder.',
			parameters: {
				type: 'object',
				properties: {
					description: {type: 'string', description: 'What needs to be done'},
					dueDate: {type: 'string', description: 'Due date in YYYY-MM-DD format'},
					tags: {type: 'string', description: 'Comma-separated tags, e.g. "work,urgent"'},
				},
				required: ['description', 'dueDate'],
			},
			execute: async args => {
				const reminder: Reminder = {
					id: crypto.randomUUID(),
					description: String(args['description']),
					complete: false,
					dueDate: String(args['dueDate']),
					tags: args['tags']
						? String(args['tags']).split(',').map(t => t.trim()).filter(Boolean)
						: [],
				};
				setReminders(prev => [...prev, reminder]);
				return {success: true};
			},
		},
		{
			name: TOOL.getReminders,
			description:
				'Get the full list of reminders. Call this before answering any question about reminders.',
			execute: async () => {
				const list = remindersRef.current;
				if (list.length === 0) return {result: 'No reminders yet.'};
				const lines = list.map(
					(r, i) =>
						`${i + 1}. [${r.complete ? 'DONE' : 'TODO'}] ${r.description} | due: ${r.dueDate} | tags: ${r.tags.join(', ') || 'none'}`,
				);
				return {result: lines.join('\n')};
			},
		},
		{
			name: TOOL.completeReminder,
			description: 'Mark a reminder as complete by its description.',
			parameters: {
				type: 'object',
				properties: {
					description: {
						type: 'string',
						description: 'The description (or part of it) of the reminder to mark done',
					},
				},
				required: ['description'],
			},
			execute: async args => {
				const target = String(args['description']).toLowerCase();
				const match = remindersRef.current.find(
					r => !r.complete && r.description.toLowerCase().includes(target),
				);
				if (!match) return {success: false, error: 'No matching incomplete reminder found'};
				setReminders(prev => prev.map(r => (r.id === match.id ? {...r, complete: true} : r)));
				return {success: true, completed: match.description};
			},
		},
	];
}

function formatDueDate(dueDate: string, today: string): string {
	if (dueDate === today) return 'today';
	if (dueDate < today) return 'overdue';
	return dueDate;
}

export default function App() {
	const {gemmaRef, isLoaded, progress, error} = useModel();
	const {stdout} = useStdout();
	const today = new Date().toISOString().split('T')[0]!;

	const [reminders, setReminders] = useState<Reminder[]>([]);
	const [output, setOutput] = useState('');
	const [input, setInput] = useState('');
	const [outputError, setOutputError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const remindersRef = useRef<Reminder[]>(reminders);
	remindersRef.current = reminders;

	const agentRef = useRef<Agent | null>(null);
	const onChunkRef = useRef<(text: string) => void>(() => {});

	const sorted = useMemo(
		() => [...reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
		[reminders],
	);

	useEffect(() => {
		if (!isLoaded || !gemmaRef.current) return;
		agentRef.current = new Agent({
			model: gemmaRef.current,
			systemPrompt: buildSystemPrompt(today),
			tools: buildTools(remindersRef, setReminders),
			historyStrategy: maxTurns(20),
			onChunk: text => {
				onChunkRef.current(text);
			},
		});
	}, [isLoaded]);

	useInput(
		(char, key) => {
			if (key.return) {
				if (!input.trim() || isGenerating || !agentRef.current) return;
				const prompt = input.trim();
				setInput('');
				setOutput('');
				setOutputError(null);
				setIsGenerating(true);
				onChunkRef.current = text => {
					setOutput(prev => prev + text);
				};
				(async () => {
					try {
						await agentRef.current!.run(prompt);
					} catch (err) {
						setOutputError(err instanceof Error ? err.message : String(err));
					} finally {
						onChunkRef.current = () => {};
						setIsGenerating(false);
					}
				})();
			} else if (key.backspace || key.delete) {
				setInput(prev => prev.slice(0, -1));
			} else if (char && !key.ctrl && !key.meta) {
				setInput(prev => prev + char);
			}
		},
		{isActive: isLoaded},
	);

	if (error) {
		return (
			<Box padding={1}>
				<Text color="red">Error: {error}</Text>
			</Box>
		);
	}

	if (!isLoaded) {
		return (
			<Box height={stdout.rows} alignItems="center" justifyContent="center" flexDirection="column">
				<Text bold color="cyan">Reminder TUI</Text>
				<Text color="yellow">Loading model... {progress}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="row" height={stdout.rows}>
			<Box
				flexDirection="column"
				width={SIDEBAR_WIDTH}
				borderStyle="round"
				borderColor="gray"
				paddingX={1}
			>
				<Text bold color="cyan">Reminders</Text>
				<Box flexDirection="column" marginTop={1} flexGrow={1}>
					{sorted.length === 0 ? (
						<Text color="gray" dimColor>None yet</Text>
					) : (
						sorted.map(r => {
							const isToday = r.dueDate === today;
							const isOverdue = r.dueDate < today;
							const color = r.complete ? 'gray' : isOverdue ? 'red' : isToday ? 'yellow' : 'white';
							return (
								<Box key={r.id} flexDirection="column">
									<Text color={color} dimColor={r.complete}>
										{r.complete ? '✓' : '○'} {r.description}
									</Text>
									<Text color="gray" dimColor>
										{'  '}{formatDueDate(r.dueDate, today)}{r.tags.length > 0 ? ` · ${r.tags.join(', ')}` : ''}
									</Text>
								</Box>
							);
						})
					)}
				</Box>
			</Box>

			<Box flexDirection="column" flexGrow={1}>
				<Box
					flexGrow={1}
					borderStyle="round"
					borderColor="gray"
					paddingX={1}
					flexDirection="column"
					overflow="hidden"
				>
					{output ? (
						<Text>
							{output}
							{isGenerating ? '▋' : ''}
						</Text>
					) : (
						<Text color="gray">Tell me what you need to keep track of…</Text>
					)}
					{outputError && <Text color="red">Error: {outputError}</Text>}
				</Box>
				<Box height={3} borderStyle="round" borderColor="greenBright" paddingX={1} alignItems="center">
					<Text color="greenBright">{'> '}{input}{'▋'}</Text>
				</Box>
			</Box>
		</Box>
	);
}
