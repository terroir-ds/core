/**
 * @module astro.config
 * 
 * Astro configuration for the Terroir Core Design System documentation site.
 * 
 * Configures the Starlight documentation theme with:
 * - GitHub Pages deployment settings
 * - Environment-aware base path (production vs development)
 * - Social links and edit functionality
 * - Custom styling
 * - Auto-generated sidebar from content structure
 * 
 * Features:
 * - Last updated timestamps on pages
 * - Pagination for better navigation
 * - GitHub edit links for contributions
 * - Path aliases for importing core library
 * - Responsive documentation layout
 * 
 * The site is deployed to: https://terroir-ds.github.io/core
 * in production, and runs on root path during development.
 */

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Configure for GitHub Pages deployment
	site: 'https://terroir-ds.github.io',
	base: process.env.NODE_ENV === 'production' ? '/core' : '/',
	
	integrations: [
		starlight({
			title: 'Terroir Core',
			description: 'A comprehensive, open-source design system built with modern web standards',
			// logo: {
			// 	light: './src/assets/logo-light.svg',
			// 	dark: './src/assets/logo-dark.svg',
			// 	replacesTitle: false,
			// },
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/terroir-ds/core' },
			],
			editLink: {
				baseUrl: 'https://github.com/terroir-ds/core/edit/main/packages/docs-site/',
			},
			lastUpdated: true,
			pagination: true,
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			components: {
				// Override default components if needed
			},
		}),
	],
	
	// Vite configuration for better development experience
	vite: {
		resolve: {
			alias: {
				'@terroir/core': '../../lib',
			},
		},
		// Ensure llms.txt is served correctly
		publicDir: 'public',
	},
});
