import type { Config } from 'tailwindcss'

const config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}'
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Additional custom colors for your specific needs
				orange: {
					50: '#fff8e6',
					100: '#ffecc6',
					200: '#ffd580',
					300: '#ffbf3f',
					400: '#ffac00', // --primary equivalent (30 100% 50%)
					500: '#e69900',
					600: '#cc7a00',
					700: '#995c00',
					800: '#663d00',
					900: '#331f00',
				},
				'dark-blue': {
					50: '#e6eeff',
					100: '#c6d9ff',
					200: '#80a6ff',
					300: '#3973ff',
					400: '#0047ff',
					500: '#0038cc',
					600: '#002b99',
					700: '#002080',
					800: '#001566',
					900: '#000b33',
				},
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '65ch',
						color: 'hsl(var(--foreground))',
						'[class~="lead"]': {
							color: 'hsl(var(--foreground))',
						},
						a: {
							color: 'hsl(var(--primary))',
							'&:hover': {
								color: 'color-mix(in srgb, hsl(var(--primary)), transparent 20%)',
							},
						},
						strong: {
							color: 'hsl(var(--foreground))',
						},
						'ol > li::marker': {
							color: 'hsl(var(--foreground))',
						},
						'ul > li::marker': {
							color: 'hsl(var(--foreground))',
						},
						hr: {
							borderColor: 'hsl(var(--border))',
						},
						blockquote: {
							color: 'hsl(var(--foreground))',
							borderLeftColor: 'hsl(var(--border))',
						},
						h1: {
							color: 'hsl(var(--foreground))',
						},
						h2: {
							color: 'hsl(var(--foreground))',
						},
						h3: {
							color: 'hsl(var(--foreground))',
						},
						h4: {
							color: 'hsl(var(--foreground))',
						},
						'figure figcaption': {
							color: 'hsl(var(--muted-foreground))',
						},
						code: {
							color: 'hsl(var(--foreground))',
						},
						'a code': {
							color: 'hsl(var(--primary))',
						},
						pre: {
							color: 'hsl(var(--foreground))',
							backgroundColor: 'hsl(var(--muted))',
						},
						thead: {
							color: 'hsl(var(--foreground))',
							borderBottomColor: 'hsl(var(--border))',
						},
						'tbody tr': {
							borderBottomColor: 'hsl(var(--border))',
						},
					},
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				marquee: {
					'100%': {
						transform: 'translateY(-50%)'
					}
				},
				'fade-in': {
					from: {
						opacity: '0'
					},
					to: {
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				marquee: 'marquee var(--marquee-duration) linear infinite',
				'fade-in': 'fade-in 0.5s linear forwards'
			}
		}
	},
	plugins: [require('tailwindcss-animate')]
} satisfies Config

export default config