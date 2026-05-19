import React from 'react';
import {Box, Text} from 'ink';

type Props = {
	readonly value: string;
};

export default function InputBar({value}: Props) {
	return (
		<Box
			height={3}
			borderStyle="round"
			borderColor="greenBright"
			paddingX={1}
			alignItems="center"
		>
			<Text color="greenBright">
				{'> '}
				{value}▋
			</Text>
		</Box>
	);
}
