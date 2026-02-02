import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				gray: {
					50: 'var(--color-gray-50, #F9FAFB)',
					100: 'var(--color-gray-100, #F1F5F9)',
					200: 'var(--color-gray-200, #E2E8F0)',
					300: 'var(--color-gray-300, #0F172A)',
					400: 'var(--color-gray-400, #94A3B8)',
					500: 'var(--color-gray-500, #64748B)',
					600: 'var(--color-gray-600, #475569)',
					700: 'var(--color-gray-700, #334155)',
					800: 'var(--color-gray-800, #0F172A)',
					850: 'var(--color-gray-850, #020617)',
					900: 'var(--color-gray-900, #0055A4)',
					950: 'var(--color-gray-950, #003F7D)'
				}
			},
			typography: {
				DEFAULT: {
					css: {
						pre: false,
						code: false,
						'pre code': false,
						'code::before': false,
						'code::after': false
					}
				}
			},
			padding: {
				'safe-bottom': 'env(safe-area-inset-bottom)'
			},
			transitionProperty: {
				width: 'width'
			}
		}
	},
	plugins: [typography, containerQueries]
};
