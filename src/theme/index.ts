import { Platform } from 'react-native';

import { monoStack, palette } from './tokens';

/**
 * §6 Step 6's token set, in one place for both consumers: `tailwind.config.js` reads the same
 * `./tokens` module, so a `bg-background` class and `palette.dark.background` cannot drift apart.
 *
 * Named roles: background, surface, text, muted, accent, success, danger, border. Both light and dark
 * values are present; which one is *active* is a styling decision — `T-5.3` makes dark the default.
 */
export { palette };

/** `bg-background` and friends come from these names. */
export type ColorName = keyof typeof palette.light;

/** §4 Phase 2's monospace stack, resolved for the running platform (`T-3.1` uses it for the input). */
export const MonoFontStack = Platform.select(monoStack) ?? monoStack.default;
