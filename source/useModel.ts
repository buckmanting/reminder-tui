import {Gemma} from '@kessler/gemma';
import type {ProgressInfo} from '@kessler/gemma';
import {useEffect, useRef, useState} from 'react';

export const useModel = () => {
	const gemma = useRef<Gemma | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [progress, setProgress] = useState('loading');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const setErrorFrom = (err: unknown) =>
			setError(err instanceof Error ? err.message : String(err));

		const onProgress = (info: ProgressInfo) => {
			if (info.status === 'loading') setProgress(`${info.progress ?? 0}%`);
			if (info.status === 'ready') setProgress('ready');
			if (info.status === 'error') setError(info.error ?? 'Unknown error');
		};

		process.on('uncaughtException', setErrorFrom);
		process.on('unhandledRejection', setErrorFrom);

		gemma.current = new Gemma({model: 'gemma-4-e2b', device: 'cpu', onProgress});

		(async () => {
			try {
				await gemma.current!.load();
				setIsLoaded(true);
			} catch (err) {
				setErrorFrom(err);
			}
		})();

		return () => {
			process.off('uncaughtException', setErrorFrom);
			process.off('unhandledRejection', setErrorFrom);
			gemma.current?.unload();
		};
	}, []);

	return {gemmaRef: gemma, isLoaded, progress, error};
};
