/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: { 
    extend: {
      fontFamily: {
        syne: ['Syne_700Bold', 'sans-serif'],
        dmsans: ['DMSans_400Regular', 'sans-serif'],
      }
    } 
  },
  plugins: [],
}
