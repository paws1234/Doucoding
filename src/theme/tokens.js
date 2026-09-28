/**
 * The one place the palette is written down.
 *
 * Read by two consumers that cannot share TypeScript: `tailwind.config.js` (CommonJS, run by Node at
 * build time) and `src/theme/index.ts` (bundled by Metro). Tailwind's own docs call for exactly this
 * — "extract them to a file that is shared with your code and your tailwind.config.js" — and Node
 * cannot `require` a `.ts` module, which is the only reason this file is plain JS.
 *
 * The overlapping values are the template's existing ones (`src/constants/theme.ts`), so nothing
 * repaints when the app migrates onto these tokens; the roles the template had no equivalent for
 * (accent/success/danger/border) are the additions.
 */

const palette = {
  light: {
    background: '#ffffff',
    surface: '#F0F0F3',
    text: '#000000',
    muted: '#60646C',
    accent: '#4F46E5',
    success: '#15803D',
    danger: '#B91C1C',
    border: '#E0E1E6',
  },
  dark: {
    background: '#000000',
    surface: '#212225',
    text: '#ffffff',
    muted: '#B0B4BA',
    accent: '#818CF8',
    success: '#4ADE80',
    danger: '#F87171',
    border: '#2E3135',
  },
};

/** Every colour the token set defines; the Tailwind name and the CSS variable share it. */
const colorNames = Object.keys(palette.light);

/** name -> `var(--color-name)`, so a class and a JS value can never disagree about a colour. */
const colors = Object.fromEntries(colorNames.map((name) => [name, `var(--color-${name})`]));

/** The same values, as the `:root` / `.dark` declarations `tailwind.config.js` emits. */
const cssVariables = (mode) =>
  Object.fromEntries(colorNames.map((name) => [`--color-${name}`, palette[mode][name]]));

/** §4 Phase 2's per-platform stack, in the shape `Platform.select` wants. */
const monoStack = {
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, monospace',
  web: 'ui-monospace, monospace',
};

module.exports = { palette, colorNames, colors, cssVariables, monoStack };
