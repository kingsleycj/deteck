import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

// The build checks the server settings (src/env.ts) in a separate step that reads the process
// environment, so the repo's .env has to be loaded here too. Values already set (Render, CI) win.
const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
	// One .env file at the repo root serves the web app, the worker and the scripts.
	envDir: '../..',
	// Fonts stay files: Vite inlines small ones as data: URLs, which the font-src 'self' policy blocks.
	// The smallest pieces are the ones with letters such as ɗ, ẹ and ọ, so Hausa, Yorùbá and Igbo
	// lost the brand font for those letters.
	build: {
		assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					// Cloudflare Turnstile, the "are you human?" check shown only after limits are hit.
					'script-src': ['self', 'https://challenges.cloudflare.com'],
					'frame-src': ['https://challenges.cloudflare.com'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self', 'https://challenges.cloudflare.com'],
					'media-src': ['self', 'blob:'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			}
		})
	]
});
