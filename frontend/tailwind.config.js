/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Replit-inspired dark theme
        'replit': {
          'bg': '#0d1117',
          'bg-root': '#010409',
          'bg-default': '#0d1117',
          'bg-subtle': '#161b22',
          'bg-muted': '#21262d',
          'bg-emphasis': '#30363d',
          'border-default': '#30363d',
          'border-muted': '#21262d',
          'border-subtle': '#161b22',
          'fg-default': '#e6edf3',
          'fg-muted': '#8b949e',
          'fg-subtle': '#6e7681',
          'accent': '#58a6ff',
          'success': '#3fb950',
          'warning': '#d29922',
          'danger': '#f85149',
          'purple': '#a855f7',
          'orange': '#f97316',
        },
        // Legacy editor colors for backwards compatibility
        'editor-bg': '#0d1117',
        'editor-sidebar': '#161b22',
        'editor-border': '#30363d',
        'editor-accent': '#58a6ff',
        'editor-text': '#e6edf3',
        'editor-comment': '#8b949e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-right': 'slideRight 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(88, 166, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(88, 166, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
