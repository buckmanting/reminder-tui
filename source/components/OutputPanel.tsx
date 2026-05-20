import React from 'react';
import {Box, Text} from 'ink';

type Props = {
	readonly output: string;
	readonly isGenerating: boolean;
	readonly error?: string;
};

export default function OutputPanel({output, isGenerating, error}: Props) {
	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			borderStyle="round"
			borderColor="gray"
			paddingX={1}
			overflow="hidden"
		>
			{output || isGenerating ? (
				<Text>
					{output}
					{isGenerating ? '▋' : ''}
				</Text>
			) : (
				<Text color="gray">Tell me what you need to keep track of…</Text>
			)}
			{error && <Text color="red">Error: {error}</Text>}
		</Box>
	);
}
