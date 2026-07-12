export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                pitch: 'var(--bg)',
                panel: 'var(--panel)',
                panelSoft: 'var(--panel-soft)',
                line: 'var(--line)',
                neon: 'rgb(var(--primary-rgb) / <alpha-value>)',
                mint: 'rgb(var(--success-rgb) / <alpha-value>)',
                cyan: 'rgb(var(--info-rgb) / <alpha-value>)',
                amber: 'rgb(var(--warning-rgb) / <alpha-value>)'
            },
            boxShadow: {
                glow: '0 0 32px rgb(var(--primary-rgb) / 0.16)',
                panel: 'var(--shadow-panel)'
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif']
            }
        }
    },
    plugins: []
};
