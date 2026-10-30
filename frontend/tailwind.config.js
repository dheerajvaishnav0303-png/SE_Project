/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          canvas: '#FAF9F5', // Warm alabaster/ivory broadsheet canvas
          sheet: '#FFFFFF',  // Pure crisp paper white
          muted: '#F4F2EB',  // Subtle hairline hover surface
        },
        ink: {
          primary: '#111827',   // Deep obsidian ink
          secondary: '#4B5563', // Muted charcoal caption/label
          faded: '#9CA3AF',     // Subtle graphite timestamp
        },
        hairline: {
          DEFAULT: '#E5E4DF', // Structural 1px broadsheet rule
          strong: '#D1CFC7',  // Focused/active divider
        },
        fin: {
          gain: '#0F5132',       // Institutional Forest Emerald
          'gain-tint': '#F0FDF4',// Muted emerald wash
          loss: '#991B1B',       // Crimson Terracotta
          'loss-tint': '#FEF2F2',// Muted terracotta wash
          navy: '#1E3A8A',       // Sovereign Navy
          'navy-tint': '#EFF6FF',
          amber: '#B45309',      // Warm Ochre
          'amber-tint': '#FFFBEB',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '0px',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};

