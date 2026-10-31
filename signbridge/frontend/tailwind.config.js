/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },
      colors: {
        surface: {
          base: '#111418',
          panel: '#181c22',
          card: '#1f242c',
          raised: '#262d37',
          border: '#2c3542',
          muted: '#3d4858',
        },
        accent: {
          50: '#f0f7fc',
          100: '#e0eff9',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
        },
        state: {
          success: '#15803d',
          successText: '#4ade80',
          warning: '#b45309',
          warningText: '#fbbf24',
          danger: '#b91c1c',
          dangerText: '#f87171',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '2px',
        md: '4px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
