/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // AYDA brand tokens. Teal is the anchor (medicine, calm, trust);
        // coral is the tension color pulled from the idea of a heartbeat/
        // pulse line - it is what keeps the palette from reading as another
        // flat teal-and-cream wellness template.
        ink: {
          DEFAULT: '#0A2B2C',
          soft: '#15332F',
        },
        teal: {
          DEFAULT: '#0F7A6E',
          dark: '#0A5A52',
          soft: '#E1F1EE',
        },
        coral: {
          DEFAULT: '#FF6F59',
          dark: '#E0523D',
          soft: '#FFE8E3',
        },
        amber: {
          DEFAULT: '#F0A73C',
          soft: '#FBF0DA',
        },
        sand: {
          DEFAULT: '#FBF6EE',
          deep: '#F1E7D6',
        },
        line: '#E7DCC7',
      },
      fontFamily: {
        // Body/UI face: carries labels, paragraphs, forms, buttons.
        sans: ['"IBM Plex Sans Arabic"', 'Tahoma', 'system-ui', 'sans-serif'],
        // Display face: headlines, big numbers, eyebrows only - used with
        // restraint, never for body copy or form inputs.
        display: ['"Changa Variable"', '"IBM Plex Sans Arabic"', 'Tahoma', 'sans-serif'],
      },
      borderRadius: {
        // A single unified scale instead of ad-hoc xl/2xl/3xl choices per
        // component: 'xl' is the one brand radius used on almost every
        // surface (cards, inputs, buttons); '2xl' is reserved for large
        // hero/photo frames; 'full' stays for genuine pills and avatars.
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 43, 42, 0.06), 0 10px 28px -14px rgba(10, 43, 42, 0.22)',
        lift: '0 2px 4px rgba(10, 43, 42, 0.08), 0 24px 48px -16px rgba(10, 43, 42, 0.3)',
        glow: '0 0 0 1px rgba(255, 111, 89, 0.15), 0 20px 40px -16px rgba(255, 111, 89, 0.35)',
      },
      backgroundImage: {
        'brand-fade': 'linear-gradient(100deg, #0F7A6E 0%, #12958A 45%, #FF6F59 120%)',
        'aurora': 'radial-gradient(60% 50% at 20% 20%, rgba(255,111,89,0.35), transparent 60%), radial-gradient(50% 60% at 85% 15%, rgba(15,122,110,0.55), transparent 65%), radial-gradient(70% 60% at 50% 100%, rgba(240,167,60,0.25), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(8px)' },
        },
        // A "lub-DUB...pause" rhythm on opacity/brightness - two quick
        // bright beats then a long dim rest, looping. This reads
        // unambiguously as a heartbeat regardless of where on the path it's
        // applied, unlike a traveling dash (which was nearly invisible while
        // crossing this path's long flat stretches - the previous attempt).
        heartbeat: {
          '0%, 100%': { opacity: '0.35', filter: 'brightness(1) drop-shadow(0 0 0 transparent)' },
          '8%': { opacity: '1', filter: 'brightness(1.6) drop-shadow(0 0 6px currentColor)' },
          '16%': { opacity: '0.45', filter: 'brightness(1)' },
          '24%': { opacity: '1', filter: 'brightness(1.6) drop-shadow(0 0 6px currentColor)' },
          '34%': { opacity: '0.35', filter: 'brightness(1) drop-shadow(0 0 0 transparent)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 9s ease-in-out infinite',
        'float-slow': 'float 13s ease-in-out infinite',
        heartbeat: 'heartbeat 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
