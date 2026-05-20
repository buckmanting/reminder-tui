import React, {useState} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {useModel} from './hooks/useModel.js';
import {useReminders, today as getToday} from './hooks/useReminders.js';
import {useAgent} from './hooks/useAgent.js';
import ReminderList from './components/ReminderList.js';
import OutputPanel from './components/OutputPanel.js';
import InputBar from './components/InputBar.js';

export default function App() {
	const {gemmaRef, isLoaded, progress, error: modelError} = useModel();
	const {stdout} = useStdout();
	const todayDate = getToday();

	const {remindersRef, sorted, addReminder, completeReminder} = useReminders();

	const [output, setOutput] = useState('');
	const [outputError, setOutputError] = useState<string>();
	const [isGenerating, setIsGenerating] = useState(false);
	const [input, setInput] = useState('');

	const {run} = useAgent({
		gemma: gemmaRef.current,
		isLoaded,
		todayDate,
		remindersRef,
		addReminder,
		completeReminder,
		onChunk(text) {
			setOutput(previous => previous + text);
		},
	});

	useInput(
		(char, key) => {
			if (key.return) {
				const prompt = input.trim();
				if (!prompt || isGenerating) return;
				setInput('');
				setOutput('');
				setOutputError(undefined);
				setIsGenerating(true);
				void (async () => {
					try {
						await run(prompt);
					} catch (error: unknown) {
						setOutputError(
							error instanceof Error ? error.message : String(error),
						);
					} finally {
						setIsGenerating(false);
					}
				})();
			} else if (key.backspace || key.delete) {
				setInput(previous => previous.slice(0, -1));
			} else if (char && !key.ctrl && !key.meta) {
				setInput(previous => previous + char);
			}
		},
		{isActive: isLoaded},
	);

	if (modelError) {
		return (
			<Box padding={1}>
				<Text color="red">Error: {modelError}</Text>
			</Box>
		);
	}

	if (!isLoaded) {
		return (
			<Box
				height={stdout.rows}
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
			>
				<Text bold color="cyan">
					Reminder TUI
				</Text>
				<Text color="yellow">Loading model... {progress}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="row" height={stdout.rows}>
			<ReminderList reminders={sorted} today={todayDate} />
			<Box flexDirection="column" flexGrow={1}>
				<OutputPanel
					output={output}
					isGenerating={isGenerating}
					error={outputError}
				/>
				<InputBar value={input} />
			</Box>
		</Box>
	);
}
