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
				globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest,avif,jpg,jpeg}'],
				// pwa.js bootstraps the install prompt + SW registration. It's
				// loaded via a <script> tag in app.html, so precaching it via
				// Workbox just causes a redundant fetch on first install and
				// it doesn't need to be available offline (PWA installs can't
				// happen offline anyway).
				globIgnores: ['**/pwa.js']
			},
			injectManifest: {
				globIgnores: ['**/pwa.js']
			}
		})
	],
	build: {
		chunkSizeWarningLimit: 600
	}
});
