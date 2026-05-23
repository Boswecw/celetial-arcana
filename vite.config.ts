import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			srcDir: 'static',
			filename: 'sw.js',
			strategies: 'injectManifest',
			injectRegister: false,
			manifest: false,
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest,avif,jpg,jpeg}']
			}
		})
	],
	build: {
		chunkSizeWarningLimit: 600
	}
});
