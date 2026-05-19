import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		ssr: './source/cli.tsx',
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				banner: '#!/usr/bin/env node',
				entryFileNames: 'cli.js',
			},
		},
	},
});
