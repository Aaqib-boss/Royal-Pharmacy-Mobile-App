/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669', // emerald-600
          light: '#34d399', // emerald-400
        },
        darkBg: {
          DEFAULT: '#0f172a', // slate-900
          card: '#1e293b', // slate-800
          input: '#334155', // slate-700
        },
        lightBg: {
          DEFAULT: '#f8fafc', // slate-50
          card: '#ffffff', // white
          input: '#f1f5f9', // slate-100
        }
      }
    },
  },
  plugins: [],
}
