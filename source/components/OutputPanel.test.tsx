import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import OutputPanel from './OutputPanel.js';

describe('OutputPanel', () => {
	it('shows placeholder when idle', () => {
		const {lastFrame} = render(<OutputPanel output="" isGenerating={false} />);
		expect(lastFrame()).toContain('Tell me what you need to keep track of');
	});

	it('renders output text', () => {
		const {lastFrame} = render(
			<OutputPanel output="Hello world" isGenerating={false} />,
		);
		expect(lastFrame()).toContain('Hello world');
	});

	it('shows cursor while generating with output', () => {
		const {lastFrame} = render(<OutputPanel isGenerating output="Thinking" />);
		expect(lastFrame()).toContain('▋');
	});

	it('shows cursor while generating before first token', () => {
		const {lastFrame} = render(<OutputPanel isGenerating output="" />);
		expect(lastFrame()).toContain('▋');
	});

	it('hides cursor when not generating', () => {
		const {lastFrame} = render(
			<OutputPanel output="Done" isGenerating={false} />,
		);
		expect(lastFrame()).not.toContain('▋');
	});

	it('renders error message', () => {
		const {lastFrame} = render(
			<OutputPanel
				output=""
				isGenerating={false}
				error="Something went wrong"
			/>,
		);
		expect(lastFrame()).toContain('Something went wrong');
	});
});
