const { colors, cssVariables } = require('./src/theme/tokens.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      // `extend`, not `theme.colors`, on purpose: the default palette stays, so every stock utility
      // already in the app (e.g. `bg-indigo-600`) keeps working.
      colors,
    },
  },
  plugins: [
    // The literal values the `colors` above point at: light on :root, dark under .dark. This is the
    // "dynamic themes" pattern from NativeWind's theming guide, with both sets coming from the one
    // shared token module rather than being typed out again here.
    ({ addBase }) => addBase({ ':root': cssVariables('light'), '.dark': cssVariables('dark') }),
  ],
};
