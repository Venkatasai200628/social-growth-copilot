/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}','./lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      colors: {
        ink: 'var(--bg)',
        surface: 'var(--bg-alt)',
        card: 'var(--card)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-soft)',
        neon: 'var(--neon)',
        gold: 'var(--gold)',
        text: 'var(--text)',
        soft: 'var(--text-soft)',
        muted: 'var(--text-muted)',
        success: 'var(--success)',
        danger: 'var(--danger)',
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
