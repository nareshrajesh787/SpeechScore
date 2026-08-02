const defaultTheme = require('tailwindcss/defaultTheme');

/**
 * "Coach's Notebook" art direction.
 *
 * The organizing idea: this is a coach's marked-up notebook, not an analytics
 * dashboard. Warm paper neutrals instead of cold zinc/gray, an editorial serif
 * for scores and headings, and semantic colors that stay honest without being
 * alarming (clay rather than fire-engine red -- users are actively improving
 * these numbers, and punishing them for it is the wrong tone).
 *
 * `accent` (gold) is deliberately scarce: it marks progress and achievement
 * ONLY. Scarcity is what makes it mean something -- do not reach for it as a
 * general highlight.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        // Scores, headline numerals, and section headings. Fraunces is a
        // variable serif with an optical-size axis, so it holds up at both
        // display sizes and small caption sizes.
        display: ['Fraunces', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // Warm paper neutrals. Replaces the cold zinc/gray mix.
        paper: {
          50: '#FDFCFA',
          100: '#FAF8F5',  // page canvas
          200: '#F4F0EA',
          300: '#E8E2D9',  // borders
          400: '#D5CCC0',
          500: '#B3A899',
        },
        // Text. Slightly cool-dark so body copy stays crisp on warm paper.
        ink: {
          DEFAULT: '#1A1D29',
          900: '#12141C',
          800: '#1A1D29',
          700: '#333846',
          600: '#4E5566',
          // 4.90:1 on paper-100. Do not lighten: this is the app's "muted
          // text" shade and Stage A already had to fix a contrast failure
          // here once (text-gray-400 -> text-gray-500).
          500: '#666D7C',
          400: '#959BA8',  // decorative / disabled only -- never body text
        },
        // Deep indigo. More authoritative than the previous bright indigo-600.
        brand: {
          50: '#EEF0FA',
          100: '#DDE1F4',
          200: '#BAC3E9',
          300: '#8E9BD9',
          400: '#6273C4',
          500: '#3F51B0',
          600: '#2F3E9E',
          700: '#26327F',
          800: '#1E2864',
          900: '#161D4A',
        },
        // Gold. RESERVED for progress/improvement/achievement.
        accent: {
          50: '#FBF5E7',
          100: '#F6E9C9',
          200: '#EDD495',
          300: '#DFB85C',
          400: '#D2A23C',
          500: '#C8952B',
          600: '#A87A20',
          700: '#855F19',
        },
        // Semantic metric tones. Muted on purpose: coaching, not alarms.
        good: {
          50: '#EEF4EF',
          100: '#D9E7DC',
          200: '#B3CFBA',
          500: '#5C8A6A',
          600: '#4F7A5C',
          700: '#3D5F47',
        },
        caution: {
          50: '#FBF4E6',
          100: '#F5E5C4',
          200: '#E9CD90',
          500: '#C6952F',
          600: '#B8862F',
          700: '#8F6722',
        },
        'needs-work': {
          50: '#FAEFEC',
          100: '#F3D9D2',
          200: '#E4B4A7',
          500: '#C26550',
          600: '#B4553F',
          700: '#8E4231',
        },
        // Transcript filler-word marking. A highlighter stripe reads as
        // "noted" rather than "error", which is the correct tone for a
        // metric the user is actively working down.
        highlighter: {
          DEFAULT: '#FDF0C4',
          strong: '#F9E29A',
        },
      },
      boxShadow: {
        // Three-tier elevation. Replaces the ad-hoc shadow-sm/lg/2xl scatter.
        card: '0 1px 2px 0 rgb(26 29 41 / 0.04), 0 1px 3px 0 rgb(26 29 41 / 0.06)',
        raised: '0 4px 6px -1px rgb(26 29 41 / 0.07), 0 2px 4px -2px rgb(26 29 41 / 0.05)',
        overlay: '0 20px 25px -5px rgb(26 29 41 / 0.12), 0 8px 10px -6px rgb(26 29 41 / 0.08)',
      },
    },
  },
  plugins: [],
}
