import React, {useState, useEffect} from 'react';
import {Text} from 'ink';
import {useModel} from './useModel.js';

export default function App() {
	const {complete, isLoaded, progress} = useModel();
	const [answer, setAnswer] = useState('');

	useEffect(() => {
		if (!isLoaded) return;

		const run = async () => {
			const result = await complete('What is the speed of light?');
			setAnswer(result);
		};

		run();
	}, [isLoaded]);

	return (
		<Text>
			Hello, <Text color="green">Aaron, {progress}</Text>
			{answer && <Text color="red">{answer}</Text>}
		</Text>
	);
}
