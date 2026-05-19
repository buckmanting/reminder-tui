import React from 'react';
import {describe, it, expect} from 'vitest';
import {render} from 'ink-testing-library';
import InputBar from './InputBar.js';

describe('InputBar', () => {
	it('renders the prompt prefix', () => {
		const {lastFrame} = render(<InputBar value="" />);
		expect(lastFrame()).toContain('>');
	});

	it('renders the current input value', () => {
		const {lastFrame} = render(<InputBar value="hello" />);
		expect(lastFrame()).toContain('hello');
	});

	it('always shows cursor', () => {
		const {lastFrame} = render(<InputBar value="" />);
		expect(lastFrame()).toContain('▋');
	});
});
