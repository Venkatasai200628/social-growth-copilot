/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        ink: '#08080d',
        surface: '#0e0e16',
        card: '#16161f',
        border: '#1e1e2e',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        neon: '#22d3ee',
        gold: '#f59e0b',
        text: '#e2e8f0',
        muted: '#64748b',
        success: '#10b981',
        danger: '#ef4444',
      },
      animation: {
        'slide-up': 'slideUp 0.35s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
