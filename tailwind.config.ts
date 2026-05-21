import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta light estilo Waze
        brand: {
          DEFAULT: '#2563eb', // blue-600 - primario
          accent: '#1d4ed8', // blue-700 - hover
          soft: '#dbeafe', // blue-100 - background suave
          subtle: '#eff6ff', // blue-50 - background muy suave
        },
        surface: {
          base: '#f8fafc', // slate-50 - fondo de pagina
          card: '#ffffff', // white - cards y panels
          input: '#ffffff',
          raised: '#f1f5f9', // slate-100 - hover
          border: '#e2e8f0', // slate-200
          divider: '#f1f5f9', // slate-100
        },
        fg: {
          DEFAULT: '#0f172a', // slate-900
          muted: '#64748b', // slate-500
          dim: '#94a3b8', // slate-400
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        logo: [
          'var(--font-logo)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        float: '0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
