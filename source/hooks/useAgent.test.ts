import type React from 'react';
import {describe, it, expect, vi} from 'vitest';
import type {Reminder} from '../types.js';
import {toolName, buildSystemPrompt, buildTools} from './useAgent.js';

const makeRef = (reminders: Reminder[]): React.RefObject<Reminder[]> => ({
	current: reminders,
});

const reminder: Reminder = {
	id: 'abc-123',
	description: 'Buy groceries',
	complete: false,
	dueDate: '2026-05-20',
	tags: ['personal'],
};

describe('buildSystemPrompt', () => {
	it('includes today date', () => {
		const prompt = buildSystemPrompt('2026-05-19');
		expect(prompt).toContain('Today is 2026-05-19');
	});

	it('references the add_reminder tool name', () => {
		const prompt = buildSystemPrompt('2026-05-19');
		expect(prompt).toContain(toolName.addReminder);
	});
});

describe('buildTools — add_reminder', () => {
	it('calls addReminder with parsed args', async () => {
		const addReminder = vi.fn().mockReturnValue(reminder);
		const completeReminder = vi.fn();
		const tools = buildTools(makeRef([]), addReminder, completeReminder);
		const tool = tools.find(t => t.name === toolName.addReminder)!;

		await tool.execute({
			description: 'Buy groceries',
			dueDate: '2026-05-20',
			tags: 'personal',
		});

		expect(addReminder).toHaveBeenCalledWith('Buy groceries', '2026-05-20', [
			'personal',
		]);
	});

	it('returns success', async () => {
		const addReminder = vi.fn().mockReturnValue(reminder);
		const tools = buildTools(makeRef([]), addReminder, vi.fn());
		const tool = tools.find(t => t.name === toolName.addReminder)!;

		const result = await tool.execute({
			description: 'x',
			dueDate: '2026-05-20',
		});
		expect(result).toEqual({success: true});
	});
});

describe('buildTools — get_reminders', () => {
	it('returns no-reminders message when list is empty', async () => {
		const tools = buildTools(makeRef([]), vi.fn(), vi.fn());
		const tool = tools.find(t => t.name === toolName.getReminders)!;

		const result = await tool.execute({});
		expect(result).toEqual({result: 'No reminders yet.'});
	});

	it('lists reminders with status, description, due date, and tags', async () => {
		const tools = buildTools(makeRef([reminder]), vi.fn(), vi.fn());
		const tool = tools.find(t => t.name === toolName.getReminders)!;

		const response = await tool.execute({});
		const typed = response as {result: string};
		expect(typed.result).toContain('Buy groceries');
		expect(typed.result).toContain('TODO');
		expect(typed.result).toContain('2026-05-20');
		expect(typed.result).toContain('personal');
	});

	it('shows DONE for completed reminders', async () => {
		const done = {...reminder, complete: true};
		const tools = buildTools(makeRef([done]), vi.fn(), vi.fn());
		const tool = tools.find(t => t.name === toolName.getReminders)!;

		const response = await tool.execute({});
		const typed = response as {result: string};
		expect(typed.result).toContain('DONE');
	});
});

describe('buildTools — complete_reminder', () => {
	it('calls completeReminder and returns success', async () => {
		const completeReminder = vi.fn().mockReturnValue(reminder);
		const tools = buildTools(makeRef([reminder]), vi.fn(), completeReminder);
		const tool = tools.find(t => t.name === toolName.completeReminder)!;

		const result = await tool.execute({description: 'groceries'});
		expect(completeReminder).toHaveBeenCalledWith('groceries');
		expect(result).toEqual({success: true, completed: 'Buy groceries'});
	});

	it('returns error when no match found', async () => {
		const completeReminder = vi.fn().mockReturnValue(undefined);
		const tools = buildTools(makeRef([reminder]), vi.fn(), completeReminder);
		const tool = tools.find(t => t.name === toolName.completeReminder)!;

		const result = await tool.execute({description: 'nonexistent'});
		expect(result).toEqual({
			success: false,
			error: 'No matching incomplete reminder found',
		});
	});
});
