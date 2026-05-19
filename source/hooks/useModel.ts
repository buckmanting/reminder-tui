import {Gemma} from '@kessler/gemma';
import type {ProgressInfo} from '@kessler/gemma';
import {useEffect, useRef, useState} from 'react';

export const useModel = () => {
	const gemma = useRef<Gemma>();
	const [isLoaded, setIsLoaded] = useState(false);
	const [progress, setProgress] = useState('loading');
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const setErrorFrom = (error_: unknown) => {
			setError(error_ instanceof Error ? error_.message : String(error_));
		};

		const onProgress = (info: ProgressInfo) => {
			if (info.status === 'loading') setProgress(`${info.progress ?? 0}%`);
			if (info.status === 'ready') setProgress('ready');
			if (info.status === 'error') setError(info.error ?? 'Unknown error');
		};

		process.on('uncaughtException', setErrorFrom);
		process.on('unhandledRejection', setErrorFrom);

		const g = new Gemma({
			model: 'gemma-4-e2b',
			device: 'cpu',
			onProgress,
		});
		gemma.current = g;

		(async () => {
			try {
				await g.load();
				setIsLoaded(true);
			} catch (error_: unknown) {
				setErrorFrom(error_);
			}
		})();

		return () => {
			process.off('uncaughtException', setErrorFrom);
			process.off('unhandledRejection', setErrorFrom);
			void gemma.current?.unload();
		};
	}, []);

	return {gemmaRef: gemma, isLoaded, progress, error};
};
