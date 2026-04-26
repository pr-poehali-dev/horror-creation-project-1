import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./1777223511394096499.html"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				oswald: ['Oswald', 'sans-serif'],
				cormorant: ['Cormorant Garamond', 'serif'],
			},
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
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
				'flicker': {
					'0%, 100%': { opacity: '1' },
					'10%': { opacity: '0.3' },
					'12%': { opacity: '1' },
					'50%': { opacity: '0.8' },
					'52%': { opacity: '0.2' },
					'54%': { opacity: '0.9' },
				},
				'glitch': {
					'0%, 100%': { transform: 'translate(0)', textShadow: '2px 0 #ff0000, -2px 0 #004400' },
					'20%': { transform: 'translate(-3px, 1px)', textShadow: '-2px 0 #cc0000, 2px 0 #003300' },
					'40%': { transform: 'translate(3px, -1px)', textShadow: '2px 0 #003300, -2px 0 #cc0000' },
					'60%': { transform: 'translate(-2px, 2px)', textShadow: '3px 0 #ff0000, -3px 0 #004400' },
					'80%': { transform: 'translate(2px, -2px)', textShadow: '-1px 0 #cc0000, 1px 0 #003300' },
				},
				'blood-drip': {
					'0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
					'100%': { transform: 'scaleY(1)', transformOrigin: 'top' }
				},
				'shake': {
					'0%, 100%': { transform: 'translate(0)' },
					'10%': { transform: 'translate(-4px, 2px)' },
					'20%': { transform: 'translate(4px, -2px)' },
					'30%': { transform: 'translate(-3px, 3px)' },
					'40%': { transform: 'translate(3px, -3px)' },
					'50%': { transform: 'translate(-2px, 2px)' },
					'60%': { transform: 'translate(2px, -2px)' },
					'70%': { transform: 'translate(-4px, 1px)' },
					'80%': { transform: 'translate(4px, -1px)' },
					'90%': { transform: 'translate(-2px, 3px)' },
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse-red': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(180,0,0,0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(180,0,0,0.8), 0 0 60px rgba(180,0,0,0.4)' }
				},
				'heartbeat': {
					'0%, 100%': { transform: 'scale(1)' },
					'14%': { transform: 'scale(1.1)' },
					'28%': { transform: 'scale(1)' },
					'42%': { transform: 'scale(1.08)' },
					'56%': { transform: 'scale(1)' },
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-8px)' },
				},
				'scan': {
					'0%': { backgroundPosition: '0 -100vh' },
					'100%': { backgroundPosition: '0 100vh' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'flicker': 'flicker 4s infinite',
				'glitch': 'glitch 3s infinite',
				'blood-drip': 'blood-drip 1.5s ease-out forwards',
				'shake': 'shake 0.5s ease-in-out',
				'fade-in': 'fade-in 0.6s ease-out forwards',
				'pulse-red': 'pulse-red 2s ease-in-out infinite',
				'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
				'slide-up': 'slide-up 0.4s ease-out forwards',
				'float': 'float 3s ease-in-out infinite',
				'scan': 'scan 8s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
