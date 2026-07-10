import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#070b10',
        panel: '#0b1117',
        panelSoft: '#101923',
        line: 'rgba(148, 163, 184, 0.16)',
        neon: '#7CFF4F',
        mint: '#42E695',
        cyan: '#55D6FF',
        amber: '#FFB84D'
      },
      boxShadow: {
        glow: '0 0 32px rgba(124, 255, 79, 0.16)',
        panel: '0 20px 80px rgba(0, 0, 0, 0.35)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
