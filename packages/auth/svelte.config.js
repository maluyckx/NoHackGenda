import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({ out: 'build' }),
		csp: {
			directives: {
				'default-src': ['self'],
				'base-uri': ['self'],
				'font-src': ['self', 'https:', 'data:'],
				'form-action': ['self'],
				'frame-ancestors': ['self'],
				'img-src': ['self', 'data:'],
				'object-src': ['none'],
				'script-src': ['self'],
				'script-src-attr': ['none'],
				'style-src': ['self', 'https:', 'unsafe-inline'],
				'upgrade-insecure-requests': true
			}
		},
		paths: {
			base: '/auth'
		}
	}
};

export default config;
