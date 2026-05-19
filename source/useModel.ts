import {Gemma} from '@kessler/gemma';
import type {ProgressInfo} from '@kessler/gemma';
import {useEffect, useRef, useState} from 'react';

export const useModel = () => {
	const gemma = useRef<Gemma | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [progress, setProgress] = useState('loading');

	const onProgress = (info: ProgressInfo) => {
		setProgress(info.status);
		if (info.status === 'loading') console.log(`${info.progress}%`);
		if (info.status === 'ready') console.log('Model ready');
		if (info.status === 'error') console.error(info.error);
	};

	useEffect(() => {
		gemma.current = new Gemma({
			model: 'gemma-4-e2b',
			onProgress,
		});

		const setup = async () => {
			await gemma.current!.load();
			setIsLoaded(true);
		};

		setup();

		return () => {
			const teardown = async () => {
				await gemma.current?.unload();
			};

			teardown();
		};
	}, []);

	const complete = async (prompt: string): Promise<string> => {
		if (!gemma.current) throw new Error('Model not loaded');
		return gemma.current.complete(prompt);
	};

	const stream = async function* (prompt: string): AsyncGenerator<string> {
		if (!gemma.current) throw new Error('Model not loaded');
		yield* gemma.current.stream(prompt);
	};

	return {stream, complete, isLoaded, progress};
};
