/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**",
    ],
    theme: {
        extend: {
            colors: {
                deepal: {
                    50: '#e8f4fc',
                    100: '#d1e9f8',
                    200: '#a3d3f1',
                    300: '#5eb3e7',
                    400: '#2d8bc9',
                    500: '#0B457F',
                    600: '#093a6b',
                    700: '#072f57',
                    800: '#052443',
                    900: '#03192f',
                    950: '#020f1c',
                },
                surface: {
                    50: '#FAFBFC',
                    100: '#F4F5F7',
                    200: '#EBEDF0',
                    300: '#DFE1E6',
                    400: '#C1C7D0',
                    500: '#97A0AF',
                    600: '#6B778C',
                    700: '#42526E',
                    800: '#253858',
                    900: '#172B4D',
                    950: '#0D1C2E',
                },
                accent: {
                    teal: '#00B8D9',
                    sky: '#00C7E6',
                    orange: '#FF6B35',
                    emerald: '#00C853',
                    coral: '#FF5252',
                }
            },
            fontFamily: {
                'display': ['Outfit', 'system-ui', 'sans-serif'],
                'body': ['Noto Sans', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow-blue': '0 0 60px -12px rgba(11, 69, 127, 0.4)',
                'glow-teal': '0 0 60px -12px rgba(0, 184, 217, 0.3)',
                'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
                'card-hover': '0 10px 40px rgba(0,0,0,0.08)',
                'elevated': '0 20px 60px -20px rgba(0,0,0,0.15)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
                'gradient-hero': 'linear-gradient(135deg, #0B457F 0%, #072f57 50%, #052443 100%)',
                'gradient-accent': 'linear-gradient(135deg, #00B8D9 0%, #0B457F 100%)',
                'gradient-surface': 'linear-gradient(180deg, #F4F5F7 0%, #FAFBFC 100%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'gradient-shift': 'gradientShift 8s ease infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                fadeInUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                slideInLeft: {
                    from: { transform: 'translateX(-100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 184, 217, 0.4)' },
                    '50%': { boxShadow: '0 0 20px 4px rgba(0, 184, 217, 0.2)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
        },
    },
    plugins: [],
}
