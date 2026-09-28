# Task Breakdown — Custom Syntax Flashcard App ("Syntax Gym")

> Source: `plan.md` · Generated: 2026-09-28 · Status: in progress

## How to use this file

Work top to bottom. The checkbox on the task heading is the single source of truth for progress —
update it, the task's `Evidence` line, and the Progress table in the same edit. If a task turns out
to be wrong or too big, split or rewrite it here first, then continue — this file is the source of
scope. `plan.md` stays unchanged.

| Mark | Meaning |
|---|---|
| `[ ]` | todo — not started |
| `[~]` | in progress — started, `Verify` not yet passing |
| `[x]` | done — its `Verify` step was run and passed |
| `[!]` | was marked done, re-verification failed |

**Size:** `S` ≤ 15 min · `M` 15–30 min. There are no `L` tasks — anything bigger was split.

**Evidence:** a task is done when its `Verify` command/observation succeeds, not when the code
exists. Record the actual command and observed result on the task's `Evidence` line.

## Progress

Keep this in sync whenever a checkbox changes. Count a task as done only when it is `[x]`; the
header `Status:` moves `not started` → `in progress` → `complete`.

| Phase | Tasks | Done / Total | Status |
|---|---|---|---|
| 0 — Scaffold: two surfaces from minute one | 15 | 13 / 15 | in progress |
| 1 — Data layer | 12 | 12 / 12 | complete |
| 2 — Core UI: flip + persist | 12 | 1 / 12 | in progress |
| 3 — Active typing mode | 6 | 0 / 6 | not started |
| 4 — Card editor, export & import | 11 | 0 / 11 | not started |
| 5 — Polish & ship | 13 | 0 / 13 | not started |
| 6 — Native Android delivery: local APK → Drive or USB | 8 | 2 / 8 | in progress |
| 7 — Verifiable gates | 5 | 0 / 5 | not started |
| 8 — End-to-end acceptance | 12 | 0 / 12 | not started |

**Overall:** 28 / 94 done

**Critical path** — nothing downstream can be believed until these pass:
`T-0.1 → T-0.3 → T-0.4 → T-0.13` (toolchain + web export proven on day one) ·
`T-0.8 → T-0.9 → T-0.10 → T-7.1 → T-7.2` (container delivery) ·
`T-1.1 → T-1.3 → T-1.5 → T-1.9 → T-1.10 → T-2.5 → T-2.8 → T-2.9` (the flip+persist spine) ·
`T-6.1 → T-6.3 → T-6.4 → T-6.8` (the APK installs and runs standalone).

## Environment variables

There is **no backend in v1** (§0.D1), so there is no database URL, no API key and no CORS config
anywhere in this project. Every variable below is a build/run-time knob for Docker, Metro or the local
Android toolchain. There is deliberately **no `EXPO_TOKEN` row**: the APK is built locally (§0.D5), so
v1 runs no `eas` command and needs no Expo account.

| Name | Used by | Where it comes from | Set in |
|---|---|---|---|
| `HOST_IP` | `web-dev` compose service | your machine's LAN IPv4 — `hostname -I \| awk '{print $1}'` | local `.env` (copied from `.env.example`), or exported in the shell |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | Metro inside `web-dev` | not typed by hand — derived from `HOST_IP` | `docker-compose.yml` (`environment:`) |
| `EXPO_NO_TELEMETRY` | build stage, `web-dev`, `ci` | not a secret — disables Expo CLI telemetry | `docker/web.Dockerfile`, `docker/dev.Dockerfile`, `docker-compose.yml` |
| `BROWSER` | `web-dev` | fixed to `none` — stops Expo CLI trying to open a browser in the container | `docker/dev.Dockerfile` |
| `CI` | `web-dev`, `ci` | fixed to `1` — makes Expo/Jest non-interactive | `docker/dev.Dockerfile`, `docker-compose.yml` |
| `NODE_ENV` | build stage | fixed to `production` for the static export | `docker/web.Dockerfile` |
| `ANDROID_HOME` | Gradle (`assembleRelease`) and `adb` | not typed by hand — the SDK path `$HOME/Android/Sdk` | `~/.bashrc` (see `BUILD.md`) |
| `JAVA_HOME` | Gradle | optional once `java` is on `PATH`; set it only if Gradle complains | `~/.bashrc`, only if needed |

`.env` must be `.gitignore`d and `.dockerignore`d (see `T-0.11`); `.env.example` is committed.

## Open questions / assumptions

Every ambiguity found in the plan, with the assumption taken so work can proceed. Answer these before
starting Phase 1 if any of them is wrong — several change file layout.

1. **Expo SDK version is not pinned.** The plan says "Expo SDK (current stable)". *Assumption:* scaffold
   with the latest stable the CLI offers, then record the exact version in `package.json` and
   `task.md`'s Phase 0 evidence. NativeWind must be the release matching that SDK.
2. **NativeWind version is not pinned.** *Assumption:* whatever the NativeWind docs prescribe for the
   scaffolded SDK. If NativeWind's install is broken for that SDK, the fallback is `StyleSheet` +
   `tailwind.config.js` tokens; that decision belongs in `T-0.5`, not later.
3. **`web.output: "single"` may not be the scaffold default.** Plan asserts it must be `single`.
   `T-0.2` confirms rather than assumes, and `T-7.1` proves the export actually emits a single-page
   build.
4. **No file is named for export/import.** §1's `lib/` lists only `storage`, `normalize`, `srs`,
   `seedCards`. *Assumption:* create `src/lib/deckIO.ts`.
5. **Share-sheet dependency is not named.** "Export/import through the OS share sheet" needs a
   dependency the plan does not list (Expo `Sharing` + `FileSystem`, or React Native `Share`).
   *Assumption:* `expo-sharing` + `expo-file-system`; `T-4.8`/`T-4.9` record the version added. This is
   the only new dependency the plan implies beyond its own stack table.
6. **PWA install vs. service worker.** §2 previously listed "Install as an app — PWA (manifest +
   service worker)", while §10 puts "PWA service worker for true offline web install" out of scope for
   v1. *Assumption:* ship only the manifest Expo emits by default; no custom service worker, no offline
   install work. The §2 row now reads "PWA manifest (Expo default)" to match.
7. **iOS is deferred by decision, not by accident.** A `.ipa` cannot be sideloaded, so iOS needs a paid
   Apple developer account and, because Xcode is macOS-only, EAS Build or a Mac. *Decision:* the
   codebase stays multiplatform so that path stays open, but **v1 ships web + Android only** (§0.D5),
   and `T-8.2` is accepted against those two surfaces. If an Apple account appears later, iOS needs its
   own plan revision — this file deliberately contains no iOS tasks.
8. **`read_only: true` on the web service is "verify on first run; drop if nginx needs another
   writable path".** *Assumption:* keep it if `T-7.2` is clean; drop it and say so if nginx writes
   anywhere outside `/var/cache/nginx` and `/var/run` (`T-7.2`).
9. **The `??` seed card is deliberately worded in JavaScript phrasing inside the PHP module.** §5's
   footnote says so. *Assumption:* seed the 17 cards **verbatim** — do not "fix" the wording in
   `T-1.2`. Cosmetic edits invalidate the plan's dataset.
10. **Deck state mechanism.** §1 says "React state + `useReducer` for the deck". *Assumption:*
    `useDeck` uses `useReducer`; the active session uses Context. No Redux/Zustand.
11. **Tests are library-only.** §1 says "Pure logic in `lib/` is unit-tested with no device", and names
    `jest-expo` + `@testing-library/react-native`. *Assumption:* v1 has tests for `lib/` only —
    `T-1.4`, `T-1.6`, `T-1.8`, `T-4.7`. No component tests, no E2E framework. `@testing-library/react-native`
    is installed because the plan names it, but no component test is written in v1.
12. **CORS is not a task and must not become one.** The execution checklist for this kind of app
    usually includes CORS config; here §0.D1 and §7 ("no backend required and no runtime network
    call") make it inapplicable. If a CORS task appears, the backend decision has been violated.
13. **No CI provider pipeline.** The plan's gate is the Compose `ci` profile, not GitHub Actions.
    *Assumption:* nothing beyond `npm run verify` + the `ci` service (see also #14).
14. **`npm run verify` is written before Jest is configured.** `T-0.6` adds the harness before `T-0.7`
    adds the script, and `T-0.13` is the first command that must not fail.
15. **No initial git commit is created by any task.** `create-expo-app` may `git init`; per the
    downstream rules, no task commits or pushes unless it says so.
16. **`android/` is generated, not source.** `expo prebuild` regenerates it, so it stays out of git
    (Expo's managed workflow, and what `T-0.11` ignores). *Assumption:* never commit it; the Android
    build is always `prebuild` then `gradlew assembleRelease`. If Gradle settings ever need
    hand-editing, that decision changes and the file becomes source.
17. **APK signing uses the debug keystore.** Expo's prebuild template signs release builds with
    `~/.android/debug.keystore`. That is fine for sideloading, and because that keystore is
    machine-local and stable, every build from **this** machine installs cleanly over the last one. A
    build made on a different machine gets a different key and fails
    `INSTALL_FAILED_UPDATE_INCOMPATIBLE` — and uninstalling clears the app's cards, so a deck export
    belongs in that procedure. A real upload keystore is needed only for the Play Store (§10).
18. **The JDK install needs `sudo`, so `T-6.1` is manual.** No agent runs it. Every Android task
    downstream of `T-6.3` is blocked until a JDK is actually present, and `BUILD.md` says so too.
19. **`BUILD.md` is currently unverified documentation.** It was written before the build path was
    exercised, so its commands are unproven; `T-6.7` exists specifically to test and correct it. Until
    then, treat it as a hypothesis, not a procedure.

---

## Phase 0 — Scaffold: two surfaces from minute one

Maps to §6 Step 1. The plan is explicit that Docker and a working web export exist **now**, before
any feature work — "an app that has never been exported to web discovers its web problems far too
late".

### [x] T-0.1 — Scaffold the Expo app with TypeScript and expo-router

- **Depends on:** none
- **Size:** `S`
- **Why:** Every later task edits files this creates; expo-router must be the routing layer from the
  first commit (§1 Stack).
- **Do:**
  1. Run `npx create-expo-app@latest . --template default` in the repo root.
  2. Confirm the scaffold uses TypeScript and expo-router (a typed `app/` directory with `_layout.tsx`).
  3. Record the resolved Expo SDK version in the Evidence line.
- **Files / artifacts:** `package.json`, `app.json`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`, `assets/`
- **Done when:** the scaffold's own screens run and TypeScript compiles with no errors.
- **Verify:** `npx tsc --noEmit` exits 0, and `npx expo start --web` on the host serves the default screen.
- **Evidence:** `npx create-expo-app@latest . --template default` (create-expo-app 5.0.0) → **Expo SDK 57**
  (`expo ~57.0.25`, `expo-router ~57.0.23`, `react-native 0.86.3`, `react 19.2.3`, `typescript ~6.0.3`,
  607 packages, 39 s). `npx tsc --noEmit` → **exit 0**. `CI=1 BROWSER=none npx expo start --web` →
  `Waiting on http://localhost:8081`, `Web Bundled 14819ms expo-router/entry.js`; a browser load of
  `http://localhost:8081/` rendered the default screen — `Welcome to Expo`, expo-router links
  `Home /` and `Explore /explore`, version badge `v57.0.25` (screenshot taken). Server then stopped.
- **Finding (directory conflict).** `create-expo-app` **refuses a non-empty directory** — it listed
  `.github`, `BUILD.md`, `plan.md`, `task.md` and exited 1 without writing anything. Worked around by
  parking exactly those four entries in `/tmp/syntax-gym-parked` (checksums recorded, `.github` copied),
  running the command, then restoring: `md5sum -c` → all 7 files `OK`. Scaffolding into a
  **subdirectory** was rejected deliberately — every task in this file names root-level `app/`, `src/`,
  `docker/` and `docker-compose.yml` paths.
- **Note (layout).** The SDK 57 default template scaffolds the router at **`src/app/`**; moved to
  **`app/`** with `mv src/app app` to match this task's `Files / artifacts` line and plan §1. Imports
  are unaffected — the template uses tsconfig's `@/* → ./src/*` alias, not relative paths.
- **Note (regression repaired).** The template **overwrote the existing `.gitignore`**, dropping the
  entries `T-0.11` had verified — `.env` was left **unignored**. Restored them (keeping the template's
  additions); re-checked: `.env` ignored, `android/app/build/outputs/apk/release/app-release.apk`
  ignored, `.env.example` **not** ignored, `.github/workflows/ci.yml` **not** ignored.
- **Note (must know).** `expo-env.d.ts` is **generated on first `expo start`** and is required by
  `tsc` — it supplies the `*.module.css` / side-effect-CSS declarations. It is gitignored. A fresh
  checkout must therefore run `expo start` (or `expo export`) once before `tsc --noEmit` passes.
- **Blocks:** `T-0.2`, `T-0.3`, `T-0.6`, `T-0.8`, `T-1.1`

### [x] T-0.2 — Set `app.json` web output to `single`

- **Depends on:** `T-0.1`
- **Size:** `S`
- **Why:** The nginx SPA fallback (`try_files ... /index.html`) only works against a single-page
  export; a `static` output would emit per-route HTML and break client-side routing.
- **Do:**
  1. In `app.json`, set `"web": { "output": "single" }`.
  2. Leave the rest of `app.json` as scaffolded.
- **Files / artifacts:** `app.json`
- **Done when:** the key is present and reads exactly `single`.
- **Verify:** `node -e "console.log(require('./app.json').expo.web.output)"` prints `single`.
- **Evidence:** `app.json` shipped the scaffold default `"output": "static"` (confirming Open question 3).
  Changed that one value to `"single"`; the rest of the file is untouched.
  `node -e "console.log(require('./app.json').expo.web.output)"` → **`single`**.
- **Blocks:** `T-0.8`, `T-7.1`

### [x] T-0.3 — Install NativeWind and Tailwind, add config and global stylesheet

- **Depends on:** `T-0.1`
- **Size:** `M`
- **Why:** §1 fixes NativeWind as the single styling system across RN and web; the original Tailwind
  intent is preserved only if the token set exists from the start.
- **Do:**
  1. Install `nativewind` and `tailwindcss` at the versions the NativeWind docs prescribe for the
     scaffoleded SDK (see Open question 2).
  2. Create `tailwind.config.js` with `content` covering `./app/**/*.{ts,tsx}` and `./src/**/*.{ts,tsx}`.
  3. Create the global stylesheet with the three Tailwind directives.
- **Files / artifacts:** `package.json`, `tailwind.config.js`, `src/global.css`
- **Done when:** the config and stylesheet exist and the packages are in `package.json` dependencies.
- **Verify:** `node -e "require('./tailwind.config.js'); console.log('ok')"` prints `ok`, and
  `grep -c '@tailwind' src/global.css` prints `3`.
- **Evidence:** `npx expo install nativewind@4.2.7` → **nativewind 4.2.7** (dependency);
  `npx expo install --dev 'tailwindcss@^3.4.17'` → **tailwindcss ^3.4.17** (devDependency).
  Docs read first (NativeWind v4 only; v5 is RC): **v4.2.7 is the release that adds Expo SDK 57 support**,
  so the SDK-matching versions are `nativewind@4.2.7` + Tailwind 3.
  `tailwind.config.js` created with exactly the prescribed shape — `content: ['./app/**/*.{ts,tsx}',
  './src/**/*.{ts,tsx}']`, `presets: [require('nativewind/preset')]`, empty `theme.extend` (T-2.1's home),
  `plugins: []`. `src/global.css` **already existed** (template font tokens), so the three directives were
  prepended to it rather than a second stylesheet being created — the `:root` tokens are preserved.
  `node -e "require('./tailwind.config.js'); console.log('ok')"` → **`ok`**; `grep -c '@tailwind'
  src/global.css` → **`3`**.
- **Note (peers already satisfied, nothing else installed).** NativeWind's peers were all present before
  this task: `react-native-reanimated 4.5.1`, `react-native-safe-area-context 5.7.0`,
  `react-native-worklets 0.10.1`, `babel-preset-expo 57.0.13`. Only two packages were added, so the
  docs' `prettier-plugin-tailwindcss` line was deliberately **not** installed — it is a formatter, not a
  runtime or build need (rules.md: no unrequested dependency).
- **Blocks:** `T-0.4`, `T-2.1`

### [x] T-0.4 — Wire NativeWind into Babel and Metro, import the stylesheet in the root layout

- **Depends on:** `T-0.3`
- **Size:** `M`
- **Why:** NativeWind does nothing until the Babel preset and Metro config point at it, and the
  stylesheet must be imported once at the root.
- **Do:**
  1. Add the NativeWind Babel preset to `babel.config.js`.
  2. Wrap the Metro config with `withNativeWind(..., { input: './src/global.css' })`.
  3. Import `../src/global.css` at the top of `app/_layout.tsx`.
- **Files / artifacts:** `babel.config.js`, `metro.config.js`, `app/_layout.tsx`
- **Done when:** a `className`-styled element renders styled on web (not unstyled).
- **Verify:** `npx expo start --web` on the host, and the rendered page's stylesheet contains the
  compiled utility classes — inspect the DOM in the browser.
- **Evidence:** `babel.config.js` created (`babel-preset-expo` with `jsxImportSource: 'nativewind'` +
  `nativewind/babel`, per the v4 docs) and `metro.config.js` created
  (`withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' })`); neither file existed
  before — the SDK 57 template ships none. `app/_layout.tsx` now imports `../src/global.css` first.
  `CI=1 BROWSER=none npx expo start --web --clear` → page loaded and inspected in the browser:
  a probe element carrying `rounded-xl bg-indigo-600 px-6 py-4` computes `background-color:
  rgb(79, 70, 229)`, `padding-top: 16px`, `border-top-left-radius: 12px`; its child carrying
  `text-center font-semibold text-white` computes `color: rgb(255, 255, 255)`. The document stylesheet
  (580 rules) contains the compiled utilities `.bg-indigo-600`, `.text-white`, `.rounded-xl`, `.px-6`,
  `.py-4`. Screenshot taken: a blue box with white text renders on the scaffolded screen.
- **Root cause fixed (uncaught web error).** The wiring alone left the app throwing
  `Cannot manually set color scheme, as dark mode is type 'media'` on every load — an Expo error overlay
  over the page, which would also fail `T-0.13`. Cause traced, not guessed: NativeWind's
  `tailwind/dark-mode.js` publishes `--css-interop-darkMode` from `config('darkMode')`, Tailwind's
  default is `media`, and `react-native-css-interop/dist/runtime/web/color-scheme.js:44-46` throws on
  `set()` whenever that flag reads `media` — reached from the `<head>` MutationObserver at line 36 the
  first time the injected stylesheet appears. Fixed as the error message itself prescribes: added
  `darkMode: 'class'` to `tailwind.config.js`. Error gone (`errors: []`), styles still applied.
- **Extra file, stated explicitly:** `app/index.tsx` gained **one** placeholder element
  (`<View className="rounded-xl bg-indigo-600 px-6 py-4">` + a white `Text`). `app/index.tsx` is not in
  this task's `Files / artifacts` line, but the task's own `Done when` — “a `className`-styled element
  renders styled on web” — is unsatisfiable without one, since nothing in the template carried a
  Tailwind class. **Finding:** this pre-satisfies `T-0.5`'s `Do` step 1 (the placeholder on the scaffolded
  index screen); when `T-0.5` runs, only its browser **and phone** observations remain. `T-0.5`'s task text
  was deliberately left untouched.
- **Also needed (type-only):** `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />,
  otherwise `className` fails `tsc --noEmit` (there is no `T-0.7` gate yet to catch it). NativeWind's own
  CLI then added it to `tsconfig.json`'s `include` automatically — that edit is the toolchain's, not hand-written.
- **Blocks:** `T-0.5`, `T-2.1`

### [ ] T-0.5 — Prove NativeWind renders identically on web and on a device

- **Depends on:** `T-0.4`
- **Size:** `S`
- **Why:** §6 Step 1 requires this verification **before** feature work. A half-wired NativeWind
  surfaces as "my styles don't apply" five tasks later, on whichever platform was not checked.
- **Do:**
  1. Render one placeholder element carrying a visible Tailwind class (e.g. a coloured, padded box)
     on the scaffolded index screen.
  2. View it at web width in the host browser.
  3. View it on a physical phone through Expo Go using `npx expo start` on the host.
- **Files / artifacts:** `app/index.tsx`
- **Done when:** the same element is visibly styled on **both** surfaces.
- **Verify:** named UI observation — screenshot/description from the browser *and* from the phone.
- **Evidence:** -
- **Blocks:** `T-2.1`, `T-2.2`

### [x] T-0.6 — Add the Jest test harness

- **Depends on:** `T-0.1`
- **Size:** `M`
- **Why:** `lib/` logic is unit-tested with no device (§1), and `npm run verify` cannot pass without
  a configured runner. This must exist before `T-0.7` adds the script.
- **Do:**
  1. Install `jest-expo`, `jest` and `@testing-library/react-native` as dev dependencies.
  2. Add the `jest` key with `preset: "jest-expo"` and a `testMatch` covering `src/lib/**`.
  3. Add a trivial passing test to confirm the harness runs.
- **Files / artifacts:** `package.json`, `jest.config.js` (or the `jest` key in `package.json`)
- **Done when:** `npx jest --ci` runs and passes with at least one test discovered.
- **Verify:** `npx jest --ci` exits 0 and reports ≥1 passing test.
- **Evidence:** `npx expo install jest-expo jest @types/jest @testing-library/react-native --dev`
  (versions taken from Expo's SDK-57 unit-testing docs, not memory) → **jest-expo ~57.0.5**,
  **jest ~29.7.0** (resolved 29.7.0), **@types/jest 29.5.14**, **@testing-library/react-native ^14.0.1**
  (its `test-renderer` peer resolved to 1.3.0). The `jest` key was added to `package.json` rather than a
  separate `jest.config.js` (fewer files): `preset: "jest-expo"` +
  `testMatch: ["**/src/**/*.test.ts?(x)"]`. Trivial check added at `src/lib/smoke.test.ts`.
  `npx jest --ci` → **exit 0**, `Test Suites: 1 passed, 1 total`, `Tests: 1 passed, 1 total`.
- **Extra file, stated explicitly:** `tsconfig.json` needed `"types": ["jest"]`. Installing
  `@types/jest` alone is **not** sufficient here — TypeScript 6.0.3 does not auto-include it, and
  `tsc --noEmit` failed with `TS2593: Cannot find name 'describe'` (3 errors) on the new test file,
  which would have failed `T-0.7`'s whole gate. Expo's own docs prescribe adding `"jest"` to `types`;
  after the change `npx tsc --noEmit` → **exit 0**, so React/JSX/Expo types still resolve.
- **`testMatch` widened deliberately:** the pattern covers `src/lib/**` as asked **and** `src/hooks/**`,
  because `T-1.11` names `src/hooks/useDeck.test.ts` as its runnable check — under a `src/lib`-only
  pattern that file would never be discovered and `T-1.11`'s `npx jest --ci` would pass while running
  nothing (a false green). Same line, same config, no extra tooling.
- **Blocks:** `T-0.7`, `T-1.4`, `T-1.6`, `T-1.8`, `T-4.7`

### [x] T-0.7 — Add the `verify` script to `package.json`

- **Depends on:** `T-0.6`, `T-0.2`
- **Size:** `S`
- **Why:** §3 gives the `ci` container a single exec-form entry point so the gate cannot drift from
  what a developer runs locally.
- **Do:**
  1. Add `"verify": "tsc --noEmit && jest --ci && expo export --platform web"` to `scripts`.
- **Files / artifacts:** `package.json`
- **Done when:** the script exists, byte-for-byte as the plan writes it.
- **Verify:** `node -e "console.log(require('./package.json').scripts.verify)"` prints
  `tsc --noEmit && jest --ci && expo export --platform web`.
- **Evidence:** `"verify": "tsc --noEmit && jest --ci && expo export --platform web"` added to
  `scripts` after `lint`.
  `node -e "console.log(require('./package.json').scripts.verify)"` →
  **`tsc --noEmit && jest --ci && expo export --platform web`** — byte-for-byte as §3 writes it.
- **Also run end to end, not just string-checked:** `npm run verify` → **exit 0**. The chain ran all
  three stages (`tsc --noEmit` clean, `Tests: 1 passed`, `Exported: dist`), so the gate works before
  `T-0.8`'s image depends on the same export step.
- **Real export layout, recorded here for `T-0.9`:** `dist/` contains `index.html`, `favicon.ico`,
  `metadata.json`, `_expo/static/css/*.css`, `_expo/static/js/web/entry-*.js`, **and** a top-level
  `assets/` tree. (`T-0.9` later listed it directly from the built image and confirmed both folders —
  an earlier draft of this line wrongly said there was no `assets/`; that came from reading only the
  tail of the export output, and the directory listing corrected it.)
- **Blocks:** `T-0.10`, `T-7.1`

### [x] T-0.8 — Add `docker/web.Dockerfile`

- **Depends on:** `T-0.2`, `T-0.7`
- **Size:** `M`
- **Why:** §3's production web image — the only one of the three surfaces Docker can ship (§0.D3).
- **Do:**
  1. Write the two-stage file exactly as §3 specifies: `node:22-bookworm-slim` build stage, `npm ci`,
     `npx expo export --platform web`, then `nginx:1.27-alpine` runtime copying `dist/`.
  2. Keep the build stage on **Debian/glibc** — the container here has no IPv6 route and musl cannot
     use the `gai.conf` workaround (§3 "Container network gotcha").
  3. Keep the exec-form `CMD ["nginx", "-g", "daemon off;"]` — no `sh -c` wrapper, so SIGTERM stops
     nginx instantly and the healthcheck-based stop does not hang.
  4. Name the build stage so `docker compose --profile ci` can target it.
- **Files / artifacts:** `docker/web.Dockerfile`
- **Done when:** `docker build -f docker/web.Dockerfile .` completes and the image contains `/app/dist`.
- **Verify:** `docker build -f docker/web.Dockerfile -t syntax-gym-web:local .` exits 0.
- **Evidence:** `docker/web.Dockerfile` written byte-for-byte as §3 specifies (build stage
  `node:22-bookworm-slim AS build` → `npm ci` → `npx expo export --platform web`; runtime stage
  `nginx:1.27-alpine AS runtime`; exec-form `CMD ["nginx", "-g", "daemon off;"]`; the `build` stage is
  named so the `ci` profile can target it).
  `docker build -f docker/web.Dockerfile -t syntax-gym-web:local .` → **exit 0**.
  Contents checked, not assumed: `docker build --target build -t syntax-gym-web:build .` then
  `ls -A /app/dist` → `_expo  assets  favicon.ico  index.html  metadata.json`;
  `docker run --rm --entrypoint sh syntax-gym-web:local -c 'ls -A /usr/share/nginx/html'` →
  `50x.html  _expo  assets  favicon.ico  index.html  metadata.json`.
- **Run-order finding (task-file defect).** This task's `Depends on` does **not** list `T-0.9`, but the
  Dockerfile does `COPY docker/nginx.conf`, so the build genuinely cannot succeed until that file
  exists. `T-0.9` was therefore run **before** `T-0.8` (both were in the batch, so nothing was skipped —
  only the order inside the run changed). `T-0.9`'s own `Verify` is satisfiable without this Dockerfile
  (it mounts its config into a stock `nginx:1.27-alpine`), which is why the swap is safe.
- **No `gai.conf` workaround needed.** The §3 "Container network gotcha" (no IPv6 route, AAAA first)
  was probed before building rather than assumed: from inside a fresh `node:22-bookworm-slim`,
  `fetch('https://registry.npmjs.org/nativewind')` returned **HTTP 200 in 550 ms** — no ~10 s stall —
  so the build stage stays on the plain Debian base with no `gai.conf` line. `npm ci` and the export
  both completed inside one 19.7 s build step.
- **Blocks:** `T-0.9`, `T-0.10`, `T-0.13`

### [x] T-0.9 — Add `docker/nginx.conf`

- **Depends on:** `T-0.8`
- **Size:** `S`
- **Why:** §3's serving rules — immutable caching for hashed assets, no-cache for the HTML shell
  (otherwise a redeploy serves a stale app), and the SPA fallback that makes expo-router URLs work.
- **Do:**
  1. Write the server block as specified: `listen 80`, `root /usr/share/nginx/html`,
     `location ~* ^/(_expo|assets)/` with the immutable cache header and `try_files $uri =404`,
     `location /` with `no-cache` and `try_files $uri $uri/ /index.html`.
  2. Add the `gzip` directives from the plan.
  3. Check the real asset folder names after the first export and adjust the location regex if the
     SDK emits something other than `_expo`/`assets` (the plan flags this explicitly).
- **Files / artifacts:** `docker/nginx.conf`
- **Done when:** the file exists and nginx starts with it without a config error.
- **Verify:** `docker run --rm --entrypoint nginx -v syntax-gym-web:local` after `T-0.10`, or
  `docker run --rm -v "$PWD/docker/nginx.conf":/etc/nginx/conf.d/default.conf:ro nginx:1.27-alpine nginx -t`
  reports `syntax is ok` / `test is successful`.
- **Evidence:** `docker/nginx.conf` written as §3 specifies (both `location` blocks, the immutable
  cache header, the SPA fallback and the three `gzip` directives).
  `docker run --rm -v "$PWD/docker/nginx.conf":/etc/nginx/conf.d/default.conf:ro nginx:1.27-alpine
  nginx -t` → **exit 0**, `the configuration file /etc/nginx/conf.d/default.conf syntax is ok` and
  `test is successful`.
- **Step 3 confirmed against the real export — both folder names are right.** The plan's note asked for
  this to be checked rather than trusted: `dist/` really does contain **both** `_expo/static/{css,js}/`
  **and** a top-level `assets/` tree (`assets/assets/images`, `assets/node_modules/@expo-google-fonts`,
  `assets/node_modules/expo-router`). So the `^/(_expo|assets)/` regex needed **no** adjustment, and the
  `assets/` alternative is load-bearing (`/usr/share/nginx/html/assets` exists in the built image).
  **Correction:** an earlier note on `T-0.7` claimed there was no top-level `assets/`; that was read from
  truncated export output and has been fixed there.
- **Ran before `T-0.8`:** see the run-order finding on `T-0.8` — its Dockerfile `COPY`s this file.
- **Blocks:** `T-0.10`, `T-0.13`

### [x] T-0.10 — Add `docker-compose.yml` with `web`, `web-dev` and `ci`

- **Depends on:** `T-0.7`, `T-0.8`, `T-0.9`
- **Size:** `M`
- **Why:** §3's Compose file is the delivery contract: one default service, one dev profile, one CI
  gate, and the Phase 5 `sync` services left commented out.
- **Do:**
  1. Add the `web` service: build from `docker/web.Dockerfile`, `8080:80`, `restart: unless-stopped`,
     `read_only: true`, `tmpfs: ["/var/cache/nginx", "/var/run"]`.
  2. Add the healthcheck using **`127.0.0.1`, never `localhost`** — busybox `wget` resolves
     `localhost` to `::1` first, nginx listens on IPv4 only, and the check then fails forever.
  3. Add `web-dev` under `profiles: ["dev"]` with `REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:?...}`,
     the `.:/app` bind mount and the `/app/node_modules` anonymous volume, and `init: true`.
  4. Add `ci` under `profiles: ["ci"]`, built from the `web` Dockerfile's build target, running
     `["npm", "run", "verify"]`.
  5. Copy the commented `api` + `db` block and the `pgdata` volume in as **comments** — Phase 5 only,
     off unless explicitly requested.
  6. Delete `web-dev`'s `BROWSER=none`/`CI=1` from Compose if they live in `dev.Dockerfile` instead —
     do not set the same variable in two places.
- **Files / artifacts:** `docker-compose.yml`
- **Done when:** Compose parses the file and lists the expected services.
- **Verify:** `docker compose config --quiet` exits 0 and `docker compose --profile dev --profile ci config --services`
  lists `web`, `web-dev`, `ci` (and **not** `api`/`db`).
- **Evidence:** `docker-compose.yml` written from §3 with all five `Do` notes applied: `web` on
  `8080:80` with `restart: unless-stopped`, `read_only: true` and `tmpfs: ["/var/cache/nginx",
  "/var/run"]`; the healthcheck probing **`127.0.0.1`** (`wget -q --spider http://127.0.0.1:80/`);
  `web-dev` under `profiles: ["dev"]` with the `.:/app` bind mount, the `/app/node_modules` anonymous
  volume, `init: true` and `REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:?...}`; `ci` under
  `profiles: ["ci"]` building `target: build` and running `["npm", "run", "verify"]`; and the `api`/`db`
  block plus the `pgdata` volume carried over as **comments**.
  Step 6 was applied too: `EXPO_NO_TELEMETRY` / `BROWSER` / `CI` were **not** repeated in Compose, since
  §3 puts them in `docker/dev.Dockerfile` — `web-dev` sets only the one variable Compose must compute
  (`REACT_NATIVE_PACKAGER_HOSTNAME`), with a comment saying where the others live.
  `docker compose config --quiet` → **exit 0**. With `HOST_IP` exported from the LAN IPv4,
  `docker compose --profile dev --profile ci config --services` → **`ci`, `web`, `web-dev`** — no `api`,
  no `db`.
- **Note (`HOST_IP` is required for the dev profile).** `${HOST_IP:?...}` makes Compose fail fast rather
  than advertise a container IP, so the profile-aware `config` check above only passes with `HOST_IP`
  set — true locally (exported from `hostname -I | awk '{print $1}'`) and true in `T-7.3`. No `.env` was
  created here (`T-0.12` owns the example file, and a real `.env` is machine-local).
- **New prerequisite discovered — `T-0.15` added below.** `web-dev` builds from
  `docker/dev.Dockerfile`, but **no task in this file creates that file**; `T-0.10` did not create it
  either, because its `Files / artifacts` line names only `docker-compose.yml`. It is recorded as a new
  task rather than folded in here.
- **Blocks:** `T-0.12`, `T-0.13`, `T-7.1`, `T-7.3`

### [x] T-0.11 — Add `.dockerignore` and extend `.gitignore`

- **Depends on:** `T-0.1`
- **Size:** `S`
- **Why:** Without `.dockerignore` the build context ships `node_modules` and `.env`; the secret file
  would be baked into an image layer and, worse, `COPY . .` would overwrite the container's installed
  modules.
- **Do:**
  1. Create `.dockerignore` with at least `node_modules`, `.git`, `dist`, `.expo`, `.env*`, `*.log`.
  2. Extend `.gitignore` with `dist/`, `.expo/` and `.env*` (keeping `.env.example` tracked).
  3. Ignore `android/` — `expo prebuild` generates it (Open question 16) — plus `*.keystore` and
     `*.jks`, so no signing material can ever be committed.
- **Files / artifacts:** `.dockerignore`, `.gitignore`
- **Done when:** both files list the entries and `.env.example` is explicitly not ignored.
- **Verify:** `git check-ignore -v .env android/app/build/outputs/apk/release/app-release.apk`
  reports a match for each, and `docker build -f docker/web.Dockerfile . 2>&1 | grep -c node_modules`
  shows the build context excludes `node_modules`.
- **Evidence:** `[~]` — `.gitignore` created and pushed (commit `8e769a8`). Covers `node_modules/`,
  `dist/`, `.expo/`, `*.log`, `.env` + `.env.*` with `!.env.example`, `android/`, `*.apk`,
  `*.keystore`, `*.jks`, plus `.github/prompts/` at the user's request. Verified with `git check-ignore -q`:
  IGNORED for `android/`, `android/app/build/outputs/apk/release/app-release.apk` and
  `app-release.apk`. GitHub's contents API returns **404** for `.github` — proof it is unpublished,
  not merely listed in a `.gitignore`.
- **Completed this run.** `.dockerignore` created with the six required entries — `node_modules`,
  `.git`, `dist`, `.expo`, `.env*`, `*.log` — plus `android` and `ios`, because those two are generated
  (`T-0.11`'s step 3 makes `android/` explicitly ignored) and would otherwise ship a multi-GB build
  context to an image that only needs app source. `.gitignore` needed **no** change: steps 2 and 3 were
  already satisfied (`.env` at line 41, `/android` at line 53), re-checked rather than assumed.
  **Both halves of `Verify` now pass.** Part 1 —
  `git check-ignore -v .env android/app/build/outputs/apk/release/app-release.apk` →
  `.gitignore:41:.env  .env` and `.gitignore:53:/android  android/app/build/.../app-release.apk`
  (a match for each); `.env.example` and `.github/workflows/ci.yml` both report **NOT ignored**.
  Part 2 — `docker build -f docker/web.Dockerfile . 2>&1 | grep -c node_modules` → **`0`**.
  Because that count is weak evidence on its own (a cached build prints almost nothing), the context
  was also listed directly: a throwaway `printf 'FROM busybox\nCOPY . /ctx\nRUN ls -A /ctx\n' |
  docker build -f- .` shows the context contains `app`, `assets`, `src`, `docker`, `node_modules`
  **absent**, `dist` **absent**, `.git`/`.expo` **absent**, no `.env*` — i.e. `.dockerignore` is doing
  its job, at a **3.72 kB** context transfer.
- **Note:** `git check-ignore android` (bare name, no trailing slash) does **not** match an
  `android/` directory-only pattern, because git cannot tell the path is a directory. Check a real
  path *under* it instead — the tree itself is genuinely ignored.
- **Note:** The prompt files are ignored as `.github/prompts/`, **not** all of `.github/`, so a
  GitHub Actions workflow can still be added at `.github/workflows/` without `git add -f`. Confirm
  with `git check-ignore -q .github/workflows/ci.yml` → must report **NOT** ignored.
- **Blocks:** `T-0.13`

### [x] T-0.12 — Add `.env.example` documenting `HOST_IP`

- **Depends on:** `T-0.10`
- **Size:** `S`
- **Why:** `web-dev` fails to start with a clear-but-cryptic Compose error if `HOST_IP` is unset. The
  variable's real value is machine-specific and cannot be committed.
- **Do:**
  1. Create `.env.example` containing a commented `HOST_IP=` line and the exact command to fill it
     (`hostname -I | awk '{print $1}'`).
  2. Do not put any value for it in the file.
- **Files / artifacts:** `.env.example`
- **Done when:** the file exists, is tracked by git, and contains no secret.
- **Verify:** `grep -n 'HOST_IP' .env.example` shows the line, and `git status --porcelain .env.example`
  does not show it as ignored.
- **Evidence:** `.env.example` created: a comments-only block explaining that `HOST_IP` is what Metro
  advertises bundle URLs with, the exact fill-in command `hostname -I | awk '{print $1}'`, why
  `.env` is ignored while this file is not, and the failure Compose raises when it is unset. Then the
  bare key **with no value**: `HOST_IP=`. No secret, as the `Done when` requires.
  `grep -n 'HOST_IP' .env.example` → line 13 (the comment) and **line 14 `HOST_IP=`**.
  `git status --porcelain .env.example` → `?? .env.example` — untracked, **not** ignored (an ignored
  path never appears without `--ignored`). Confirmed again by
  `git check-ignore -q .env.example` → **not ignored**.
- **Staged, so "tracked by git" is literally true:** `git add .env.example` →
  `git status --porcelain` now reports `A  .env.example`. Staging only; **no commit or push was made**
  (no task in the batch asks for one). This also doubles as the proof the file is committable rather
  than merely absent from `.gitignore`.
- **Blocks:** `T-7.3`

### [x] T-0.13 — Phase 0 gate — the container serves a web build

- **Depends on:** `T-0.8`, `T-0.9`, `T-0.10`, `T-0.11`
- **Size:** `M`
- **Why:** §6 Step 1's explicit exit condition: `docker compose up --build` serves a page before any
  feature exists. This is the cheapest possible moment to discover a broken export or nginx config.
- **Do:**
  1. Run `docker compose up --build -d`.
  2. Wait for the healthcheck to report healthy rather than assuming it.
  3. Load the site in a browser at `http://127.0.0.1:8080/`.
  4. If the container is unhealthy or the page is blank, the asset folder regex in `nginx.conf` is the
     first suspect — fix and re-run.
- **Files / artifacts:** none — verification of `docker/web.Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`
- **Done when:** `docker compose ps` shows `web` as `healthy` and the placeholder app renders at
  `http://127.0.0.1:8080/`.
- **Verify:** `docker compose ps --format '{{.Service}} {{.Health}}'` prints `web healthy`, **and** a
  browser load of `http://127.0.0.1:8080/` shows the scaffolded screen with NativeWind styles applied.
- **Evidence:** `docker compose up --build -d` → exit 0, image `syntax-gym-web:local` built and
  `doulingoforcoding-web-1` started. Health was **read until it changed, not assumed**: the first
  `ps` said `web starting` (`FailingStreak: 0`, `Log: []` — no probe had landed yet), and the next read
  gave `docker compose ps --format '{{.Service}} {{.Health}}'` → **`web healthy`**.
  `curl http://127.0.0.1:8080/` → **HTTP 200**, `<title>Doulingoforcoding</title>`; the healthcheck's own
  probe also succeeds from inside (`docker exec ... wget -q --spider http://127.0.0.1:80/` → OK).
  Browser load of `http://127.0.0.1:8080/` inspected in the DOM: the Tailwind probe box carries
  `rounded-xl bg-indigo-600 px-6 py-4` and computes `background-color: rgb(79, 70, 229)`,
  `padding-top: 16px`; `hasErrorOverlay: false`; the page pulls
  `/_expo/static/css/web-*.css` and `/_expo/static/js/web/entry-*.js` from the container. Screenshot taken.
- **The `Do` step 4 suspicion was checked, and is not the problem.** The asset regex is correct because
  `_expo` is genuinely the emitted folder — assets resolve with **HTTP 200** and
  `Content-Type: text/css`. Serving rules verified end to end rather than eyeballed:
  `index.html` → `Cache-Control: no-cache`; the hashed CSS →
  `Cache-Control: public, max-age=31536000, immutable`; `GET /explore` → **HTTP 200 text/html**
  (SPA fallback works, so client-side routes will not 404); the shell comes back
  `Content-Encoding: gzip`. `docker compose logs web` filtered for
  `permission denied|error|crit|warn` → **empty**, i.e. `read_only: true` with the two `tmpfs` mounts is
  clean on this nginx (the decision `T-7.2` is asked to make is already looking like "keep it").
- **Blocks:** `T-2.1`, `T-7.2`

### [ ] T-0.14 — Smoke-build an APK from the bare scaffold

- **Depends on:** `T-0.5`
- **Size:** `M`
- **Why:** The Android toolchain has more moving parts than the web build — JDK version, SDK platform,
  Gradle, NDK — and each one fails late and loudly. This is the Android twin of `T-0.13`: prove the
  surface from a placeholder, before five phases of app code sit on top of an unproven build. The
  missing JDK was already the first surprise on this path; this is where the rest of them surface.
- **Do:**
  1. Run `npx expo prebuild --platform android` in the repo root.
  2. Run `cd android && ./gradlew assembleRelease`.
  3. Expect a long first run while Gradle and the Android dependencies download. Do not interrupt it.
  4. Do not change app code to make this pass. A failure here is a **toolchain** problem, which is
     precisely what this task exists to expose.
- **Files / artifacts:** `android/` (generated; ignored per `T-0.11`),
  `android/app/build/outputs/apk/release/app-release.apk`
- **Done when:** a release APK is produced from the unmodified scaffold, with the JS bundled in.
- **Verify:** `ls -lh android/app/build/outputs/apk/release/app-release.apk` shows a file of tens of
  MB, and `unzip -l <apk> | grep -c index.android.bundle` is ≥ 1.
- **Evidence:** -
- **Blocks:** `T-6.3`
- **Machine prerequisites:** `T-6.1` (done) and `T-6.2`. They are **host setup**, not app work, which
  is why they keep their Phase 6 IDs rather than being renumbered into Phase 0 — the dependency
  direction here is deliberate and recorded, not accidental.
- **Note:** This APK is a **toolchain proof, not the deliverable**. `T-6.8` is where an APK is
  accepted as the way the app ships. Installing this throwaway build on the phone is optional, and
  only worth it if you want the earliest possible confirmation that sideloading works.

### [x] T-0.15 — Add `docker/dev.Dockerfile`

- **Depends on:** `T-0.8`
- **Size:** `S`
- **Why:** Discovered while running `T-0.10` (`2026-09-28`), not planned. `docker-compose.yml`'s
  `web-dev` service does `build: { dockerfile: docker/dev.Dockerfile }` and §3 specifies that file —
  but **no task in this file created it**, so `docker compose --profile dev up web-dev` (and with it
  `T-7.3`) had no image to build. `T-0.10` deliberately did not create it: that task's
  `Files / artifacts` line names `docker-compose.yml` only.
- **Do:**
  1. Write the file exactly as §3 specifies: `FROM node:22-bookworm-slim`, `WORKDIR /app`,
     `COPY package.json package-lock.json ./`, `RUN npm ci`, `COPY . .`,
     `ENV EXPO_NO_TELEMETRY=1 BROWSER=none CI=1`, `EXPOSE 8081`,
     `CMD ["npx", "expo", "start", "--port", "8081"]`.
  2. Keep `EXPO_NO_TELEMETRY` / `BROWSER` / `CI` **here** and not in Compose — `T-0.10`'s step 6 removed
     them from `web-dev` on the assumption this file owns them, so a value added in both places would
     undo that de-duplication.
- **Files / artifacts:** `docker/dev.Dockerfile`
- **Done when:** the image builds and the file matches §3.
- **Verify:** `docker build -f docker/dev.Dockerfile -t syntax-gym-web-dev:local .` exits 0.
- **Evidence:** `docker/dev.Dockerfile` written exactly as §3's block — `FROM node:22-bookworm-slim`, `WORKDIR /app`, `COPY package.json package-lock.json ./`, `RUN npm ci`, `COPY . .`, `ENV EXPO_NO_TELEMETRY=1 BROWSER=none CI=1`, `EXPOSE 8081`, exec-form `CMD ["npx", "expo", "start", "--port", "8081"]` (exec form keeps SIGTERM reaching the process).
  Step 2 was re-read rather than assumed: Compose's `web-dev` sets **only**
  `REACT_NATIVE_PACKAGER_HOSTNAME`, so `EXPO_NO_TELEMETRY`/`BROWSER`/`CI` genuinely live here alone.
  `docker build -f docker/dev.Dockerfile -t syntax-gym-web-dev:local .` → **exit 0**,
  `naming to docker.io/library/syntax-gym-web-dev:local`.
  Contents checked rather than assumed: `docker run --rm --entrypoint node syntax-gym-web-dev:local -e
  "console.log('expo', require('/app/package.json').dependencies.expo)"` → **`expo ~57.0.25`**, i.e. the
  image really carries the app source and its installed dependencies.
- **Blocks:** `T-7.3`
- **Note:** `T-7.3`'s `Depends on` line does not name this task and should. `T-7.3` is outside the batch
  that found this gap, so its text was left untouched deliberately — noted here so the next run sees it.

---

## Phase 1 — Data layer

Maps to §6 Step 2. Content and progress are separate maps, `schemaVersion` + `migrate()` exist from
day one, and `normalize.ts` is the single comparison rule the typing mode will use.

### [x] T-1.1 — Create `src/types/card.ts`

- **Depends on:** `T-0.1`
- **Size:** `S`
- **Why:** §1's data model. The content/progress split and the `deletedAt` tombstone are "painful to
  retrofit, so they are in from day one".
- **Do:**
  1. Declare `ModuleId` (`'containers' | 'js-ts' | 'php-laravel' | 'sql'`), `Status`
     (`'new' | 'need-practice' | 'mastered'`), `Card`, `ReviewState`, `PersistedState` exactly as §1
     shows, including `deletedAt?: number` on `Card` and `schemaVersion: 1` on `PersistedState`.
  2. Use `Record<string, Card>` / `Record<string, ReviewState>` — content and progress are **separate
     maps**.
- **Files / artifacts:** `src/types/card.ts`
- **Done when:** `tsc --noEmit` passes and the file exports all five symbols.
- **Verify:** `npx tsc --noEmit` exits 0.
- **Evidence:** `src/types/card.ts` created by transcribing §1's Data Model block verbatim —
  `ModuleId`, `Status`, `Card` (with `deletedAt?: number`), `ReviewState`, `PersistedState`
  (`schemaVersion: 1`, `cards: Record<string, Card>`, `reviews: Record<string, ReviewState>` — content
  and progress as **separate maps**). The two `Record` maps are the point of the task, so they were
  checked literally rather than by eye. `npx tsc --noEmit` → **exit 0**, and a symbol sweep confirms
  all five are exported: `ModuleId` (line 1), `Status` (2), `Card` (4), `ReviewState` (16),
  `PersistedState` (26).
- **Blocks:** `T-1.2`, `T-1.3`, `T-1.9`, `T-2.3`

### [x] T-1.2 — Create `src/lib/seedCards.ts` with the exact 17 cards

- **Depends on:** `T-1.1`
- **Size:** `M`
- **Why:** §5's dataset is the app's entire initial content and the basis of the DoD's first line.
- **Do:**
  1. Transcribe all 17 cards from §5 **verbatim** — 4 containers, 5 JS/TS, 4 PHP/Laravel, 4 SQL. Do not
     reword the PHP `??` card: §5's footnote says its JavaScript phrasing is intentional.
  2. Give every card a stable id in the form `seed-<module>-<n>` (§1's example: `seed-containers-1`).
  3. Export them as a module-level array (or the `Card`-shaped record the storage layer will merge).
- **Files / artifacts:** `src/lib/seedCards.ts`
- **Done when:** the file contains exactly 17 cards, ids unique, every `module` one of the four
  `ModuleId` values, `isCustom: false` on all.
- **Verify:** `grep -c "id: 'seed-" src/lib/seedCards.ts` prints `17`, and
  `npx tsc --noEmit` exits 0.
- **Evidence:** `src/lib/seedCards.ts` created as one exported `Card[]` — all 17 of §5's rows
  transcribed verbatim, ids in §1's `seed-<module>-<n>` form, the PHP `??` card keeping its
  deliberately JavaScript phrasing (§5 footnote). All 17 spread a single `SEED_DEFAULTS`
  (`isCustom: false` plus a fixed `SEEDED_AT`) so re-seeding is idempotent — a per-launch
  `Date.now()` would rewrite all 17 records on every start and defeat `T-1.10`'s merge.
  `grep -c "id: 'seed-" src/lib/seedCards.ts` → **17**; duplicate-id sweep
  (`grep -o … | sort | uniq -d`) → **empty**; per-module counts → **containers 4, js-ts 5,
  php-laravel 4, sql 4**; `grep -c 'isCustom: true'` → **0**; `npx tsc --noEmit` → **exit 0**.
- **Blocks:** `T-1.9`, `T-8.1`

### [x] T-1.3 — Create `src/lib/storage.ts`

- **Depends on:** `T-1.1`
- **Size:** `M`
- **Why:** §1's single call site for persistence — AsyncStorage on native, localStorage on web — with
  one versioned key so the shape can change later.
- **Do:**
  1. Wrap `@react-native-async-storage/async-storage` behind typed `loadState()` / `saveState()`.
  2. Use the key `syntax-gym/v1/state` — one JSON document.
  3. Debounce writes by ~300 ms so a rapid session does not write per tap.
  4. Return a sensible empty state when nothing is stored yet.
- **Files / artifacts:** `src/lib/storage.ts`, `package.json` (`@react-native-async-storage/async-storage`)
- **Done when:** the module compiles and the storage key is a single exported constant.
- **Verify:** `npx tsc --noEmit` exits 0 and `grep -n "syntax-gym/v1/state" src/lib/storage.ts` matches once.
- **Evidence:** `npx expo install @react-native-async-storage/async-storage` → **2.2.0** (a dependency;
  `expo install` chose the SDK-57-compatible version rather than a hand-picked one). `src/lib/storage.ts`
  created with typed `loadState()` / `saveState()`, one exported `STORAGE_KEY`, and `emptyState()` for
  the nothing-stored-yet path. `grep -n "syntax-gym/v1/state" src/lib/storage.ts` → **line 6, one
  match**. `npx tsc --noEmit` → **exit 0**.
- **Note (debounce shape).** Coalescing, not a trailing reset: the timer is armed once and always
  writes the newest document, so a change every 200 ms still lands within one window instead of
  starving the write forever. `pending` is cleared only *after* `setItem` resolves, so a rejected write
  leaves the document queued rather than silently dropping the deck.
- **Extra export, stated explicitly.** `flushState()` is exported and not named in the `Do` steps. The
  debounce is only safe if something can write immediately: `T-1.5`'s save→load round-trip case needs
  it, and so does an app-lifecycle flush in `T-1.11`. Without it both callers sit at the timer's mercy.
- **Lint note (pre-existing, not this batch).** `npx expo lint` reports **1 error** in the SDK 57
  template's `src/hooks/use-color-scheme.web.ts` (`react-hooks/set-state-in-effect`). It is untouched by
  this task and by every task in the batch, and lint is not part of `npm run verify`. The new `src/lib`
  files are clean.
- **Lint tooling side effect, reverted.** Running `npx expo lint` at all **self-scaffolds**: it installed
  `eslint@^9` + `eslint-config-expo~57` as devDependencies and wrote `eslint.config.js`. No task asks for
  either, so both were removed again (`npm uninstall`, `rm eslint.config.js`) — `package.json`'s diff
  now contains only the `async-storage` line. Consequence to know: `"lint": "expo lint"` has been in
  `scripts` since the scaffold, but **the repo has no linter installed**, and the next `expo lint` run
  will re-create these two files. That is why the pre-existing error above is reported rather than
  fixed.
- **Blocks:** `T-1.4`, `T-1.5`, `T-1.9`

### [x] T-1.4 — Add `schemaVersion` handling and `migrate()` to `src/lib/storage.ts`

- **Depends on:** `T-1.3`
- **Size:** `M`
- **Why:** "With no server there is nobody to fix the shape later — and you *will* change this model"
  (§1). An unrecognised or malformed document must not silently become a wiped deck.
- **Do:**
  1. On read, compare the stored `schemaVersion` against the current one and run `migrate()`.
  2. Treat a missing/malformed document as a fresh state; **never** throw away a document whose
     version is newer than this build — surface it rather than overwriting it.
  3. Keep the migration table a plain, readable switch so the next bump is one case.
- **Files / artifacts:** `src/lib/storage.ts`
- **Done when:** `migrate()` is exported and called on the load path.
- **Verify:** the check in `T-1.5` passes: `npx jest src/lib/storage.test.ts --ci`.
- **Evidence:** `src/lib/storage.ts` gained an exported `migrate()` plus the version check on the load
  path. `migrate()` is one `switch` with a single `case SCHEMA_VERSION:` — the next bump is one case
  and one `return`, as step 3 asks — and it returns `null` for a missing *or* unknown version.
  It also rejects a version match whose `cards`/`reviews` are not records, so a truncated document
  cannot reach the merge and crash it.
- **How step 2 is actually satisfied.** `loadState()` now returns `LoadResult { state, newerVersion? }`.
  Unparseable JSON and a malformed shape both fall back to `emptyState()` **without writing**, and a
  `schemaVersion` greater than this build's reports `newerVersion` *and* sets a module-level write
  block. The block is the load-bearing half: `flushState()` refuses the write, so a fresh deck cannot
  land on top of a document this build cannot read. `T-1.5`'s last case asserts the stored bytes are
  **unchanged** after a `saveState` + `flushState`.
- **Verify, run as written:** deferred to `T-1.5` exactly as this task's `Verify` line specifies —
  `npx jest src/lib/storage.test.ts --ci` → **6 passed**. `migrate()` is exported and called from
  `loadState` (`migrate(parsed) ?? emptyState()`).
- **Blocks:** `T-1.5`, `T-1.9`, `T-4.6`

### [x] T-1.5 — Add `src/lib/storage.test.ts`

- **Depends on:** `T-1.4`, `T-0.6`
- **Size:** `M`
- **Why:** `migrate()` is the one piece of v1 logic whose failure loses the user's deck. Per the
  project's rules, non-trivial logic leaves one runnable check behind.
- **Do:**
  1. Test that a `schemaVersion: 1` document round-trips through save → load unchanged.
  2. Test that an empty store yields a valid empty `PersistedState`.
  3. Test that a malformed document does not destroy data — the newest-version case is preserved or
     reported, not overwritten.
  4. Mock AsyncStorage; no device, no fixtures beyond the literal objects.
- **Files / artifacts:** `src/lib/storage.test.ts`
- **Done when:** the suite fails if `migrate()` is removed or a version is dropped on the floor.
- **Verify:** `npx jest src/lib/storage.test.ts --ci` exits 0 with all cases passing.
- **Evidence:** `src/lib/storage.test.ts` created, mocking AsyncStorage with the package's own mock
  (`@react-native-async-storage/async-storage/jest/async-storage-mock`) rather than a hand-rolled one —
  no device, fixtures are literal objects.
  `npx jest src/lib/storage.test.ts --ci` → **exit 0, 6 passed**: `migrate()` accepts v1 and rejects a
  version dropped on the floor, a future version, a string and `null`; an empty store yields a valid
  empty `PersistedState` and does **not** create the document; a full document round-trips save → load
  with deep equality (tombstone and non-default review state intact); unparseable JSON resolves to a
  fresh state without throwing with the bytes preserved; a malformed `cards` value does the same; and a
  newer `schemaVersion` is reported with the stored bytes **unchanged** after a save attempt.
- **`Done when` proved, not assumed:** renaming `case SCHEMA_VERSION:` to `case -1:` (dropping the
  version on the floor) made the suite fail — **2 failed, 4 passed**; restored and re-run → **6 passed**,
  `npx tsc --noEmit` → **exit 0**.
- **Note:** the newer-version case is declared last on purpose — `loadState` sets a module-level write
  block that stands for the module's lifetime, so it has to run after the cases that need writes to
  land. A comment in the file says so.
- **Blocks:** `T-1.11`

### [x] T-1.6 — Create `src/lib/normalize.ts`

- **Depends on:** `T-0.1`
- **Size:** `S`
- **Why:** §4 Phase 2's comparison rule — "indentation-insensitive but otherwise exact — this is a
  syntax trainer, so never fuzzy-match punctuation."
- **Do:**
  1. Export one comparison function: trim, collapse runs of whitespace, ignore trailing newlines.
  2. Do **not** normalise case, quotes, brackets, operators or punctuation — a syntax trainer that
     accepts `=>` for `->` teaches the wrong thing.
  3. Return enough information for the feedback UI to render a diff/expected answer (correct or not,
     plus the normalised forms).
- **Files / artifacts:** `src/lib/normalize.ts`
- **Done when:** the module compiles and exports a single comparison entry point.
- **Verify:** `npx jest src/lib/normalize.test.ts --ci` passes (written in `T-1.7`).
- **Evidence:** `src/lib/normalize.ts` created exporting exactly **one** comparison entry point,
  `compareAnswer(typed, expected) → AnswerComparison { correct, answer, expected }` (plus that type).
  Whitespace is the only thing relaxed — `replace(/\s+/g, ' ').trim()` handles leading indentation,
  interior spacing runs, line breaks and trailing newlines in one line. Case, quotes, brackets,
  operators and punctuation are untouched, as step 2 requires. The normaliser itself is a
  module-private one-liner, so there is no second entry point to call by accident, and the returned
  normalised forms are what `T-3.4`'s feedback UI diffs (step 3).
- **Verify, run as written:** deferred to `T-1.7` exactly as this task's `Verify` line says —
  `npx jest src/lib/normalize.test.ts --ci` → **15 passed**; `npx tsc --noEmit` → **exit 0**.
- **Blocks:** `T-1.7`, `T-3.1`, `T-3.3`

### [x] T-1.7 — Add `src/lib/normalize.test.ts`

- **Depends on:** `T-1.6`, `T-0.6`
- **Size:** `M`
- **Why:** §6 Step 2 names this test explicitly, and it is the difference between a syntax trainer and
  a spelling game.
- **Do:**
  1. Cases that **must pass**: differing leading indentation, extra interior spaces, a trailing
     newline, and one of §5's real seed answers typed exactly.
  2. Cases that **must fail**: a changed bracket (`()` vs `[]`), a changed operator (`=>` vs `=`),
     reordered words, and a missing semicolon where the seed has one.
  3. Assert on the returned judgement, not on internal helpers.
- **Files / artifacts:** `src/lib/normalize.test.ts`
- **Done when:** both groups pass, and the suite fails if the punctuation checks are loosened.
- **Verify:** `npx jest src/lib/normalize.test.ts --ci` exits 0.
- **Evidence:** `src/lib/normalize.test.ts` created with both groups the `Do` steps name, every case
  asserting on `compareAnswer(...).correct` rather than on an internal helper. The `must pass` rows and
  several `must fail` rows read **§5's real seed answers** out of `seedCards` (§5's own wording: "one of
  §5's real seed answers typed exactly"), so the cases cannot silently drift from the shipped dataset.
  `npx jest src/lib/normalize.test.ts --ci` → **exit 0, 15 passed** — 7 correct (exact seed, leading
  indentation, interior spaces, surrounding spaces, trailing newline, tabs, and a multi-line SQL answer
  split where the seed has a space) and 7 incorrect (changed bracket `obj(key)`, the wrong container
  bracket `[ ]` for `( )`, changed operator `=` for `=>`, reordered words, missing semicolon, changed
  case, quoted key where the seed is unquoted).
- **`Done when` proved, not assumed:** loosening the punctuation handling (making `collapseWhitespace`
  also strip `[^a-z0-9 ]`) failed **6 of 15** — precisely the punctuation cases; restored → **15 passed**,
  `npx tsc --noEmit` → **exit 0**.
- **Blocks:** `T-1.11`, `T-3.3`, `T-8.4`

### [x] T-1.8 — Create `src/lib/srs.ts`

- **Depends on:** `T-1.1`
- **Size:** `M`
- **Why:** §4 Phase 3's "spaced repetition lite": correct → interval grows ×ease; incorrect → reset to
  1 day and flag Need Practice.
- **Do:**
  1. Export a pure function taking the previous `ReviewState` plus the review outcome and returning
     the next `ReviewState` with `dueAt`, `intervalDays`, `ease` (default 2.5), `reviewCount`,
     `correctCount`, `lastReviewedAt`.
  2. Export the queue ordering rule: session queue = due first, then Need Practice, then New.
  3. Keep `ease` clamped to a sane floor so a bad streak cannot push a card years out.
- **Files / artifacts:** `src/lib/srs.ts`
- **Done when:** the module compiles and exports scheduling plus ordering.
- **Verify:** `npx jest src/lib/srs.test.ts --ci` passes (written in `T-1.9`).
- **Evidence:** `src/lib/srs.ts` created exporting the two things this task names —
  `scheduleReview(previous, correct, now) → ReviewState` (pure, `now` injected) and
  `queueRank(review, now)` for the due → Need Practice → New rule. §4 Phase 3's numbers are SM-2's own
  (default ease 2.5, floor 1.3, −0.2 per wrong answer), so no constant is invented; a wrong answer is
  the only thing that lowers ease, which is what the floor then clamps.
- **One deliberate asymmetry:** `status` is written on **incorrect only**. `T-3.5`'s manual status
  buttons own that field, and this function also writing it on a correct answer would give one field
  two writers. Matches §4 Phase 3 ("incorrect → … and flag Need Practice").
- **Ease is rounded to a tenth per step** because repeated `-0.2` otherwise leaves `1.9000000000000001`.
  `queueRank` returns 0/1/2 with the order named in its comment; `Array.prototype.sort` is stable, so
  `T-5.2`'s "stable order inside a bucket" costs the caller nothing.
- **Verify, run as written:** deferred to `T-1.9` exactly as this task's `Verify` line says —
  `npx jest src/lib/srs.test.ts --ci` → **5 passed**; `npx tsc --noEmit` → **exit 0**.
- **`ponytail:` no interval cap.** The floor keeps `ease` sane, but nothing bounds `intervalDays`, so a
  long correct streak does walk a card out to years — which is the outcome step 3's rationale was
  aiming at. Left as a marked cut rather than inventing a cap constant no task names; the upgrade path
  is recorded in the file (a cap when the scheduler stops being "lite", §10).
- **Blocks:** `T-1.9`, `T-2.8`, `T-5.1`
- **Note:** `srs.ts` is written here but is **not** wired into the session until `T-5.1`; Phase 2's
  queue is status-only so the flip loop can be proven first.

### [x] T-1.9 — Add `src/lib/srs.test.ts`

- **Depends on:** `T-1.8`, `T-0.6`
- **Size:** `S`
- **Why:** Scheduling arithmetic is non-trivial logic with a data-loss consequence when it resets a
  card wrongly.
- **Do:**
  1. Correct answer on a fresh card → `intervalDays` grows and `ease` does not drop.
  2. Incorrect answer → `intervalDays` back to 1 and status `need-practice`.
  3. Queue ordering returns due items before Need Practice before New.
  4. Use an injected `now` so the test does not depend on the clock.
- **Files / artifacts:** `src/lib/srs.test.ts`
- **Done when:** all cases pass without touching AsyncStorage.
- **Verify:** `npx jest src/lib/srs.test.ts --ci` exits 0.
- **Evidence:** `src/lib/srs.test.ts` created, all four `Do` cases covered, `now` injected everywhere
  (a `NOW` constant) so nothing depends on the clock; AsyncStorage is never imported.
  `npx jest src/lib/srs.test.ts --ci` → **exit 0, 5 passed**: a fresh card's correct answer gives
  `intervalDays` 1, seeds ease 2.5, sets `dueAt = now + 1 day`, leaves `status` at `new`, and the next
  correct answer grows the interval without dropping ease; a wrong answer on a 21-day `mastered` card
  resets `intervalDays` to 1, flags `need-practice`, lowers ease and does **not** increment
  `correctCount`; 21 consecutive wrong answers stop at ease **1.3**; `queueRank` orders due <
  need-practice < new, treats a missing review exactly like New, ranks a not-yet-due card with New, and
  a real `sort` of `[fresh, practice, due]` yields `[due, practice, fresh]`; a card due exactly `now`
  counts as due.
- **`Done when` proved, not assumed:** lowering the floor (`MIN_EASE` 1.3 → 0) failed the floor case —
  **1 failed, 4 passed**; restored → **5 passed**, `npx tsc --noEmit` → **exit 0**.
- **Note on a first, bogus attempt at that check:** an earlier `sed` edit left an unbalanced paren on
  line 40, so that run reported `Tests: 0 total` — a compile error, not a failing assertion, and so
  proof of nothing. It was repaired and the check re-run properly; the final run above confirms the
  file compiles.
- **Blocks:** `T-5.1`, `T-5.2`

### [x] T-1.10 — Create `src/hooks/useDeck.ts` — hydrate and merge

- **Depends on:** `T-1.2`, `T-1.3`, `T-1.4`
- **Size:** `M`
- **Why:** §1's load rule — "`cards` unioned with seeds (seed ids are stable), `reviews` always wins
  over seed defaults" — is what makes re-seeding safe for existing progress.
- **Do:**
  1. Use `useReducer` for deck state (§1's state choice).
  2. On mount, load via `storage.ts`, then merge: seeds union custom cards by id; stored `reviews`
     win; a stored card overrides a seed of the same id (wording fixes must not wipe mastery).
  3. Expose hydration state so the UI can show a loading state without blocking first paint (§9).
  4. Expose the merge as a pure function so `T-1.11`'s test can call it without React.
- **Files / artifacts:** `src/hooks/useDeck.ts`
- **Done when:** a slice of the app can read merged deck state on web and on the phone.
- **Verify:** `npx tsc --noEmit` exits 0, and after `T-2.2` the app renders 17 seeded cards on first
  run — re-verify here with a temporary `console.log` of the merged card count on web.
- **Evidence:** `src/hooks/useDeck.ts` created with `useReducer` (§1's state choice) and the merge kept
  as a pure `mergeDeck(stored)` **outside** the hook, so `T-1.11`'s check can call it without React.
  The merge is exactly §1's rule: seeds are laid down first, then stored cards overlay them by id — so a
  wording fix, a user edit or a tombstone survives re-seeding — and `reviews` is the stored map, since
  seeds ship none. `hydrated` starts `false` and the read happens in an `useEffect`, so first paint
  never waits on storage (§9). `newerVersion` is carried through from `loadState`, giving `T-1.4`'s
  "surface it" a consumer instead of dead data.
- **Verify, run as written:** `npx tsc --noEmit` → **exit 0**, and the temporary `console.log` the task
  asks for was actually run: with a one-off probe wired into `app/index.tsx`,
  `CI=1 BROWSER=none npx expo start --web` + a real page load captured in the browser console
  **`T-1.10 merge: 17 cards, 0 reviews, newerVersion = undefined`**, and a **second** load logged the
  same 17 — no accumulation, no duplicated seed ids. The Metro terminal independently printed the same
  line on all three loads.
- **Read-only confirmed:** `window.localStorage` was still **empty** after the loads — this task reads,
  it does not persist (`T-1.11` owns the write).
- **Probe removed again:** the `DeckProbe` component and its two imports were added to `app/index.tsx`
  solely for the measurement and deleted straight after; `git diff --stat app/index.tsx` → **empty**
  (byte-identical to HEAD), `npx tsc --noEmit` → **exit 0** afterwards.
- **Blocks:** `T-1.11`, `T-2.2`, `T-2.9`

### [x] T-1.11 — Add mutations and debounced persist to `src/hooks/useDeck.ts`

- **Depends on:** `T-1.10`, `T-1.5`
- **Size:** `M`
- **Why:** Adding, editing, soft-deleting a card and updating a `ReviewState` are the only writes the
  app makes; they must land in one document through the debounced writer.
- **Do:**
  1. Expose `addCard`, `updateCard`, `softDeleteCard` (set `deletedAt`, never hard-delete) and
     `setReview(reviewId, next)`.
  2. `addCard` must use `crypto.randomUUID()` for custom ids and set `isCustom: true`. Handle the
     case where `crypto.randomUUID` is unavailable rather than crashing.
  3. Persist through `storage.ts`'s debounced writer on state change.
  4. Leave exactly one runnable check for the merge/mutation reducer (`src/hooks/useDeck.test.ts` or
     the pure reducer alongside it) — the smallest thing that fails if soft-delete starts hard-deleting.
- **Files / artifacts:** `src/hooks/useDeck.ts`, plus one small test file
- **Done when:** adding a card, reloading and seeing it still there works on web.
- **Verify:** `npx jest --ci` exits 0 with the new check, and a browser reload on web keeps a manually
  added card.
- **Evidence:** `src/hooks/useDeck.ts` extended with a `Deck` interface and the four actions
  (`addCard`, `updateCard`, `softDeleteCard`, `setReview`), each a thin dispatch onto the now-exported
  `deckReducer`. `addCard` sets `isCustom: true` and mints its id through `newId()`, which falls back to
  `custom-<base36 time>-<random>` when `crypto.randomUUID` is absent rather than throwing mid-save.
  `softDeleteCard` sets a tombstone and nothing else — `reviews` is untouched, so an un-delete cannot
  have lost progress. The single write path is an effect calling storage's debounced `saveState`
  whenever `cards`/`reviews` change, **guarded on `hydrated`** so the un-hydrated empty deck can never
  overwrite the user's document.
- **Verify, both halves run for real.** Jest: `npx jest --ci` → **exit 0, 5 suites, 32 tests passed**,
  including the new `src/hooks/useDeck.test.ts`. Browser: with a temporary probe exposing the deck, a
  load of `:8081` started at **17 cards**, `addCard` wrote a `localStorage` document with
  `schemaVersion: 1` and **18 cards**, and after a hard **reload** the deck came back with **18**,
  including `5b094c4f-… :: T-1.11 probe card`. `npx tsc --noEmit` → **exit 0**.
- **The crypto fallback was checked, not assumed:** shadowing `crypto.randomUUID` to `undefined`
  (`typeof` → `undefined`) and adding again did **not** throw, minted `custom-mule1b27-e7r3hl45`, and
  that card survived a reload too — **19 cards**.
- **Test-file note:** `src/hooks/useDeck.test.ts` needs the package's AsyncStorage mock even though its
  cases are pure, because `useDeck` imports `storage`, which imports the native module — without it the
  suite failed to load (`1 failed` suite, `0` tests from it, `27` from the others). Added the same
  `jest.mock` its sibling test uses.
- **Cleanup, so the next check is not polluted:** the probe was removed, `app/index.tsx` is
  byte-identical to HEAD, and the two probe cards were cleared from that origin's `localStorage`
  (`length: 0`) — otherwise `T-1.12`'s "17 cards both times" would have read 19.
- **Blocks:** `T-2.9`, `T-2.10`, `T-4.4`

### [x] T-1.12 — Phase 1 gate — the data layer is provably sound

- **Depends on:** `T-1.5`, `T-1.7`, `T-1.9`, `T-1.11`
- **Size:** `S`
- **Why:** Phase 1's whole value is a storage layer that cannot silently lose a deck; that claim needs
  one end-to-end run, not four isolated ones.
- **Do:**
  1. Run the full verify chain on the host.
  2. Open the app on web, confirm the 17 seeds are present and no duplicates appear on a second load.
- **Files / artifacts:** none — verification only
- **Done when:** the full chain passes and the seed merge is idempotent.
- **Verify:** `npm run verify` exits 0, **and** loading the web app twice shows 17 cards both times
  (no duplicated seed ids).
- **Evidence:** `npm run verify` → **exit 0** — `tsc --noEmit` clean, `Test Suites: 5 passed, 5 total`,
  `Tests: 32 passed, 32 total`, `Exported: dist`. Re-run after the temporary probe was removed →
  **exit 0** again.
- **App-level idempotence, measured rather than assumed.** The first attempt was against the rebuilt
  container, and it wrote **no document at all**: no screen renders the deck yet (`T-2.2`/`T-2.9` are its
  first consumers), so `useDeck` never runs on a bare container load. That is correct for this point in
  the plan, and it is also why this observation needs a temporary probe — the same technique `T-1.10`'s
  `Verify` line prescribes. With the probe in place on `:8081`, three loads were read:
  1. load 1 → **17 cards, 17 unique ids, 17 seeds, 0 non-seed**;
  2. load 2, with load 1's document in place → **17 cards**, id list byte-identical to load 1;
  3. load 3, after wiping the stored `cards` map to `{}` as a sentinel → **17 cards** again, so the merge
     genuinely re-seeds rather than coasting on what was already stored.
  `unique === cards` on every load: no duplicated seed ids.
- **Probe removed:** `app/index.tsx` is byte-identical to HEAD, and that origin's `localStorage` was
  cleared (`length: 0`).
- **Blocks:** `T-2.2`

---

## Phase 2 — Core UI: flip + persist

Maps to §6 Step 3 and §4 Phase 1 (features 1–4). The smallest end-to-end path that proves the app
works: a card that flips, a status that sticks, a filter that shows it.

### [x] T-2.1 — Create the theme tokens in `src/theme/`

- **Depends on:** `T-0.4`
- **Size:** `M`
- **Why:** §6 Step 6 requires dark mode **by default** and §9 requires colour to behave on every
  surface. Defining tokens once keeps NativeWind classes and JS-side values (e.g. SVG, status bar)
  from drifting.
- **Do:**
  1. Define the token set (background, surface, text, muted, accent, success, danger, border, plus the
     monospace font stack) in `src/theme/`.
  2. Extend `tailwind.config.js`'s `theme.extend` with those tokens so classes and JS share one source.
  3. Include both light and dark values; the *default* choice is wired in `T-5.3`.
- **Files / artifacts:** `src/theme/index.ts`, `tailwind.config.js`
- **Done when:** importing the tokens in a component and using a corresponding class produce the same
  colour.
- **Verify:** `npx tsc --noEmit` exits 0, and on web the computed background of a `bg-background`
  element equals the token value.
- **Evidence:** the token set now lives in `src/theme/`, with both light and dark values, exported as
  `palette` (named roles: background, surface, text, muted, accent, success, danger, border) plus
  `MonoFontStack` as §4 Phase 2's per-platform stack.
- **The one-source constraint, and how it was met.** `tailwind.config.js` runs in Node as CommonJS and
  therefore **cannot `require` a `.ts` module**, so the palette lives in `src/theme/tokens.js` —
  Tailwind's own docs prescribe exactly this ("extract them to a file that is shared with your code and
  your `tailwind.config.js`"). Both `tailwind.config.js` and `src/theme/index.ts` read it, so a value is
  written down once. `src/theme/tokens.js` is an **extra file, stated explicitly**: it exists only
  because of that CJS/TS split, and it is the only place a hex literal appears.
- **Mechanism.** `theme.extend.colors` maps each name to `var(--color-<name>)`, and a `plugins` entry
  `addBase`s the literals — light on `:root`, dark on `.dark` (the documented "dynamic themes"
  pattern). `extend` rather than `theme.colors` on purpose, so the stock palette survives and the
  existing `bg-indigo-600` probe keeps working. `src/global.css` needed **no** change.
- **Overlap declared, not duplicated.** background/surface/text/muted are the template's existing
  values from `src/constants/theme.ts`, so nothing repaints when the app is migrated onto these tokens;
  accent/success/danger/border are the roles the template had no equivalent for. The two vocabularies
  coexist until `T-5.3` applies the tokens to every screen — that is its scope, not this task's.
- **Verify, run as written:** `npx tsc --noEmit` → **exit 0**. On web, with a temporary `bg-background`
  probe, the class computed **`rgb(255, 255, 255)`** = `palette.light.background` (`#ffffff`); after
  adding `dark` to `<html>` it computed **`rgb(0, 0, 0)`** = `palette.dark.background`. A class and the
  JS token agree in **both** modes — this task's `Done when`.
- **A doubt chased down rather than waved away:** the variable read back as `#fff`/`#000` rather than
  `#ffffff`/`#000000`. Enumerating every stylesheet rule that declares `--color-background` returned
  exactly two — `:root` and `.dark` — so nothing overrides the tokens and the shortening is Tailwind's
  own processing. All eight tokens carry their declared values in both modes (`--color-muted`
  `#60646c`/`#b0b4ba`, `--color-accent` `#4f46e5`/`#818cf8`, …).
- **Re-checked after the config change:** `npx jest --ci` → **32 passed**; `npm run verify` → **exit 0**
  with `Exported: dist`, so the new config did not break the export. Probe removed — `app/index.tsx` is
  byte-identical to HEAD.
- **Blocks:** `T-2.2`, `T-2.5`, `T-5.3`

### [ ] T-2.2 — Wire theme and the hydration gate into `app/_layout.tsx`

- **Depends on:** `T-1.10`, `T-2.1`
- **Size:** `M`
- **Why:** §1 calls `_layout.tsx` the root shell: theme plus a storage hydration gate. §9 adds the
  constraint that first paint must not block on the storage read.
- **Do:**
  1. Wrap the tree in the themed shell and render the router.
  2. Show a loading state while `useDeck` hydrates — but render the shell immediately; the gate is on
     content, not on paint.
  3. Do not put any storage call in a place that delays the first render.
- **Files / artifacts:** `app/_layout.tsx`
- **Done when:** the app shows a loading state, then the deck, with the shell visible throughout.
- **Verify:** `npx expo start --web` renders the shell before hydration completes — observe in the
  browser's network/performance panel that HTML paints before the storage read resolves.
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-2.11`

### [ ] T-2.3 — Create `src/components/ModuleNav.tsx`

- **Depends on:** `T-1.1`
- **Size:** `M`
- **Why:** §4 Phase 1 feature 2 — the four fixed modules plus "All", and §2 requires tab-like
  behaviour on phone with no keyboard dependency.
- **Do:**
  1. Render `Containers | JS/TS | PHP+Laravel | SQL | All` from `ModuleId` plus an "All" option.
  2. Tab strip on narrow widths, sidebar on wide web — the layout switch itself lands in `T-5.4`; here
     emit the structure and a single responsive breakpoint.
  3. Emit the selected module to a callback; hold no deck state.
- **Files / artifacts:** `src/components/ModuleNav.tsx`
- **Done when:** tapping each option changes the selected value with no keyboard.
- **Verify:** named UI observation on web and in Expo Go — each of the five options selects and
  highlights.
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-2.10`

### [ ] T-2.4 — Create `src/components/FilterBar.tsx`

- **Depends on:** `T-1.1`
- **Size:** `S`
- **Why:** §4 Phase 1 feature 4 — `All | New | Need Practice | Mastered`.
- **Do:**
  1. Render the four filter options driven by `Status` plus "All".
  2. Show the "X left in Need Practice" counter.
  3. Call back with the selected filter; take the count as a prop.
- **Files / artifacts:** `src/components/FilterBar.tsx`
- **Done when:** all four options render, select, and the counter reflects the prop.
- **Verify:** named UI observation on web — each option selects, and the counter changes when the
  passed count changes.
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-2.10`

### [ ] T-2.5 — Create `src/components/FlipCard.tsx` — tap to flip

- **Depends on:** `T-2.1`
- **Size:** `M`
- **Why:** §4 Phase 1 feature 1 — the core mechanic: front is a natural-language prompt, back is
  exact minimal syntax.
- **Do:**
  1. Render front/back with a flip animation; **tap** reveals.
  2. Render the back in the monospace stack so syntax reads as code.
  3. Announce the visible side for accessibility (the full `accessibilityLabel` sweep is `T-5.5`,
     but a card that cannot say which side it is showing has to be fixed here).
  4. Respect reduced motion — `T-5.10` supplies the hook; until then, degrade to an instant swap when
     the platform reports reduced motion.
- **Files / artifacts:** `src/components/FlipCard.tsx`
- **Done when:** tapping flips front→back→front and the text is the card's own front/back.
- **Verify:** named UI observation on web and in Expo Go — three consecutive taps alternate the side,
  and the back shows monospace syntax.
- **Evidence:** -
- **Blocks:** `T-2.6`, `T-2.9`, `T-8.3`

### [ ] T-2.6 — Add swipe / drag-to-flip to `src/components/FlipCard.tsx`

- **Depends on:** `T-2.5`
- **Size:** `M`
- **Why:** §4 Phase 1 feature 1 lists tap, swipe, Space. §2's matrix calls web swipe a mouse drag and
  native swipe a real gesture, so this is a separate interaction to build and verify.
- **Do:**
  1. Add a horizontal drag gesture that flips on release past a small threshold.
  2. Use the gesture library already available with the scaffold (React Native's `PanResponder` if no
     gesture dependency is installed) — **do not add a dependency** for this.
  3. Keep tap working; the two must not fight for the same touch.
- **Files / artifacts:** `src/components/FlipCard.tsx`
- **Done when:** a drag past threshold flips; a small drag does not; a tap still flips.
- **Verify:** named UI observation — on web, drag the card with the mouse and it flips; in Expo Go,
  swipe and it flips; a tiny drag leaves the side unchanged.
- **Evidence:** -
- **Blocks:** `T-8.3`, `T-8.10`

### [ ] T-2.7 — Create `src/components/StatusButtons.tsx`

- **Depends on:** `T-1.1`
- **Size:** `S`
- **Why:** §4 Phase 1 feature 4 — per-card Need Practice / Mastered, reachable without a keyboard.
- **Do:**
  1. Two buttons calling back with `need-practice` / `mastered`.
  2. Reflect the current status so a re-tap is visible.
  3. Meet the ≥44 pt target from §9 (the formal audit is `T-5.6`).
- **Files / artifacts:** `src/components/StatusButtons.tsx`
- **Done when:** each button fires the callback and shows the active status.
- **Verify:** named UI observation on web — tapping each button highlights it and the callback value
  changes.
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-8.5`

### [ ] T-2.8 — Create `src/hooks/useSession.ts`

- **Depends on:** `T-1.1`
- **Size:** `M`
- **Why:** §1 gives the active session its own Context-driven hook: queue building, current index,
  scoring. Phase 2 needs the status-only queue; `T-5.2` swaps in the SRS ordering.
- **Do:**
  1. Build the queue from the deck + current module + current filter.
  2. Track the current index and expose next/previous.
  3. Handle the end of the queue and an empty queue as named states, not crashes.
  4. Keep scoring (`reviewCount`/`correctCount`) behind `useDeck`'s `setReview`, not local state.
- **Files / artifacts:** `src/hooks/useSession.ts`
- **Done when:** a queue is built for each module and filter, and advancing past the end is defined.
- **Verify:** named UI observation after `T-2.9` — the session advances through the queue and shows a
  defined state at the end instead of an error.
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-3.2`, `T-5.2`

### [ ] T-2.9 — Wire the Session screen in `app/index.tsx`

- **Depends on:** `T-2.2`, `T-2.3`, `T-2.4`, `T-2.5`, `T-2.7`, `T-2.8`
- **Size:** `M`
- **Why:** §4 Phase 1 — the screen where drilling happens. This is the first real end-to-end path.
- **Do:**
  1. Compose `ModuleNav`, `FilterBar`, `FlipCard` and `StatusButtons` into the session screen.
  2. Connect `useSession` for the current card and `useDeck.setReview` for status changes.
  3. Make every interaction reachable by touch — no keyboard required (§2's explicit rule).
- **Files / artifacts:** `app/index.tsx`
- **Done when:** a full loop works: pick module → flip → mark Need Practice → next card.
- **Verify:** named UI observation on web: flip a card, mark Need Practice, advance; the deck's
  Need Practice counter increments by one.
- **Evidence:** -
- **Blocks:** `T-2.11`, `T-2.12`, `T-3.2`

### [ ] T-2.10 — Create `app/cards.tsx` — deck manager

- **Depends on:** `T-2.3`, `T-2.4`, `T-1.11`
- **Size:** `M`
- **Why:** §1's Deck manager screen: list, filter, search. Also where the "X left in Need Practice"
  figure is meaningful.
- **Do:**
  1. Render the deck list (excluding cards with a `deletedAt`).
  2. Reuse `ModuleNav` and `FilterBar` rather than re-implementing filtering.
  3. Add search across front/back text.
  4. Exclude soft-deleted cards from every count.
- **Files / artifacts:** `app/cards.tsx`
- **Done when:** the list filters by module, by status and by search text, and counters match.
- **Verify:** named UI observation on web — filter to `sql` + `need-practice`, and the list and the
  counter agree with the data.
- **Evidence:** -
- **Blocks:** `T-4.4`, `T-4.10`, `T-8.5`
- **Note:** §1's architecture lists `FilterBar` as `All | New | Need Practice | Mastered` without a
  search box, but `cards.tsx` is described as "list, filter, search". Search lives here, not in
  `FilterBar`.

### [ ] T-2.11 — Add loading, empty-deck and empty-filter states

- **Depends on:** `T-2.2`, `T-2.9`
- **Size:** `S`
- **Why:** §9 lists these by name: "loading (storage hydrate), empty deck, empty filter result, and
  incorrect-answer feedback all get designed, not just defaulted."
- **Do:**
  1. Loading state while hydration is in flight.
  2. Empty-deck state (a hydrated but card-less deck).
  3. Empty-filter-result state — distinct from the empty deck; do not show them the same screen.
- **Files / artifacts:** `app/index.tsx`, `app/cards.tsx`
- **Done when:** all three states render distinctly.
- **Verify:** named UI observation — loading is visible on a cold start; filtering to a combination
  with no matches shows the empty-filter state rather than a blank screen.
- **Evidence:** -
- **Blocks:** `T-2.12`

### [ ] T-2.12 — Phase 2 gate — flip and persist work on web

- **Depends on:** `T-2.9`, `T-2.11`
- **Size:** `S`
- **Why:** §4 Phase 1's four features in one run, on the platform that is cheapest to check.
- **Do:**
  1. Open the web app, flip a card, mark it Need Practice.
  2. Reload the page.
- **Files / artifacts:** none — verification only
- **Done when:** the status survived the reload and the filter shows the card under Need Practice.
- **Verify:** named UI observation — after reload, filter by Need Practice and the card is listed;
  `localStorage` contains the `syntax-gym/v1/state` document.
- **Evidence:** -
- **Blocks:** `T-3.1`, `T-7.2`

---

## Phase 3 — Active typing mode

Maps to §6 Step 4 and §4 Phase 2 (feature 5). Reuses `normalize.ts` — this phase adds no comparison
logic of its own.

### [ ] T-3.1 — Create `src/components/ActiveInput.tsx`

- **Depends on:** `T-1.6`, `T-2.1`
- **Size:** `M`
- **Why:** §4 Phase 2's input hygiene list: `autoCapitalize="none"`, `autoCorrect={false}`,
  `spellCheck={false}`, and a per-platform monospace stack. Getting this wrong makes the typing mode
  fight the device keyboard.
- **Do:**
  1. Monospace `TextInput` using `Platform.select({ ios: 'Menlo', android: 'monospace', web: 'ui-monospace, monospace' })`.
  2. Set `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}`.
  3. Take the user's input and a submit callback; hold no comparison logic.
  4. Keep `autoFocus` off here — `T-5.11` decides when to focus.
- **Files / artifacts:** `src/components/ActiveInput.tsx`
- **Done when:** typing shows monospace text with no autocapitalisation or spell-check squiggles.
- **Verify:** named UI observation — type `const x = 1;` on web and the input renders monospace with
  the initial `c` not capitalised, and no autocorrect suggestion appears.
- **Evidence:** -
- **Blocks:** `T-3.3`, `T-8.4`

### [ ] T-3.2 — Add the Flip ↔ Type toggle to the session screen

- **Depends on:** `T-2.8`, `T-2.9`
- **Size:** `S`
- **Why:** §4 Phase 2 feature 5 — one toggle between the two modes, with the same queue behind both.
- **Do:**
  1. Add the mode toggle to `app/index.tsx`; hold the mode in session state.
  2. In Type mode show the front only, plus `ActiveInput`.
  3. Leave the Flip path untouched — switching back must fully restore it.
- **Files / artifacts:** `app/index.tsx`
- **Done when:** toggling switches modes without losing the current card or the queue position.
- **Verify:** named UI observation — advance three cards in Flip mode, switch to Type, and the same
  card index is showing with its front text.
- **Evidence:** -
- **Blocks:** `T-3.3`, `T-3.5`
- **Open question:** the plan says the toggle exists but does not say where it lives. Assumption:
  on the session screen, per §4 Phase 2's "toggle Flip ↔ Type".

### [ ] T-3.3 — Compare input through `normalize.ts` on Enter (web) or Check (all platforms)

- **Depends on:** `T-3.1`, `T-3.2`, `T-1.6`
- **Size:** `M`
- **Why:** §4 Phase 2 — Check on Enter on web, a button everywhere, compared through `normalize.ts`.
  The button is the primary path because §2 requires that no interaction needs a keyboard.
- **Do:**
  1. Add a Check button that works on web and on the phone — the primary path, so no interaction
     needs a keyboard (§2).
  2. Add the Enter-to-submit path on web only, via the keyboard adapter from `T-5.7` — until that
     exists, use the submit action available on the input.
  3. Call `normalize.ts`; do not re-implement comparison.
- **Files / artifacts:** `app/index.tsx` (or the Type-mode component it delegates to)
- **Done when:** submitting an answer produces a verdict on web and on the phone.
- **Verify:** named UI observation on web — pressing the Check button and pressing Enter both produce
  the same verdict for the same input.
- **Evidence:** -
- **Blocks:** `T-3.4`, `T-8.4`

### [ ] T-3.4 — Render correct / incorrect feedback and the expected answer

- **Depends on:** `T-3.3`
- **Size:** `M`
- **Why:** §4 Phase 2 — "show correct / incorrect plus the expected answer". §9 counts
  incorrect-answer feedback as a designed state, not a default.
- **Do:**
  1. Correct → positive feedback; do not auto-advance without the user asking.
  2. Incorrect → distinct feedback plus the exact expected syntax, monospace, so the difference is
     visible without re-flipping.
  3. Keep the verdict visible until the next card; do not flash and vanish.
- **Files / artifacts:** `app/index.tsx`
- **Done when:** both verdicts render with the expected answer visible on the incorrect path.
- **Verify:** named UI observation — answer one card correctly (`const name = value;`) and one
  incorrectly with reordered words; the second shows the expected string.
- **Evidence:** -
- **Blocks:** `T-3.5`, `T-8.4`
- **Placeholder detail (`ponytail:`):** a character-level diff is out of scope for v1 — show
  correct/incorrect plus the expected answer, which is what §4 Phase 2 asks for. Upgrade path:
  `T-10`'s syntax highlighting work (§10) is where a real diff belongs.

### [ ] T-3.5 — Offer a status update after checking

- **Depends on:** `T-3.4`, `T-2.7`
- **Size:** `S`
- **Why:** §4 Phase 2 — "offer a status update after checking". The verdict must not silently write
  a status the user did not choose.
- **Do:**
  1. After a verdict, surface `StatusButtons` (or an equivalent prompt) so the user can mark the card.
  2. Do not auto-write a status from the verdict alone — `T-5.2` adds the SRS scheduling that reacts
     to correctness, and that is a separate, deliberate write.
- **Files / artifacts:** `app/index.tsx`
- **Done when:** a status can be set straight after checking, and skipping it is allowed.
- **Verify:** named UI observation — answer incorrectly, tap Need Practice, advance, and the counter
  reflects the change.
- **Evidence:** -
- **Blocks:** `T-3.6`, `T-5.1`

### [ ] T-3.6 — Phase 3 gate — exact comparison, not fuzzy

- **Depends on:** `T-3.4`, `T-3.5`
- **Size:** `S`
- **Why:** §4 Phase 2 states the rule the app lives or dies by: "indentation-insensitive but otherwise
  exact — never fuzzy-match punctuation." A gate that only checks the happy path would miss it.
- **Do:**
  1. Enter a seed answer with different indentation and extra interior spaces → expect correct.
  2. Enter the same answer with one bracket changed → expect incorrect.
  3. Toggle to Flip and confirm the flip path still works.
- **Files / artifacts:** none — verification only
- **Done when:** all three hold on web.
- **Verify:** named UI observation for all three cases, the second one showing the expected answer.
- **Evidence:** -
- **Blocks:** `T-4.1`, `T-8.4`

---

## Phase 4 — Card editor, export & import

Maps to §6 Step 5 and §4 Phase 3 feature 7. Soft delete, not hard delete, and a JSON round-trip that
losslessly survives the version envelope.

### [ ] T-4.1 — Create `src/components/CardEditor.tsx`

- **Depends on:** `T-1.1`, `T-2.1`
- **Size:** `M`
- **Why:** §1 lists one shared form rendered by the route — one implementation for both "new" and
  "edit".
- **Do:**
  1. Fields: front, back, module; front mono-capable where it is syntax.
  2. Controlled by props (`initialCard`, `onSubmit`) — no data access inside.
  3. Surface validation errors passed in as props (`T-4.3` owns the rules).
- **Files / artifacts:** `src/components/CardEditor.tsx`
- **Done when:** the form renders for both an empty and a prefilled card.
- **Verify:** named UI observation — the editor renders prefilled from a seed card's front/back.
- **Evidence:** -
- **Blocks:** `T-4.2`, `T-4.3`

### [ ] T-4.2 — Create the `app/edit/[id].tsx` route

- **Depends on:** `T-4.1`, `T-1.11`
- **Size:** `M`
- **Why:** §1's card editor route, used for both new and edit. §2 requires real URLs on web, so `new`
  and an existing id must both be routable.
- **Do:**
  1. Read the `id` param; treat the new-card route (a sentinel such as `new`) as an empty form.
  2. On an existing id, load the card from `useDeck` and prefill.
  3. On submit, call `addCard` or `updateCard` and navigate back.
  4. Handle a missing/soft-deleted id with a defined state, not a crash.
- **Files / artifacts:** `app/edit/[id].tsx`
- **Done when:** both routes work and a new card appears in the deck after saving.
- **Verify:** named UI observation — navigate to the new-card route, save, and the deck count
  increases by one; deep-link to an existing card's URL on web and the form is prefilled.
- **Evidence:** -
- **Blocks:** `T-4.3`, `T-4.4`
- **Open question:** §1 shows the route as `app/edit/[id].tsx`; the plan does not say how "new" is
  encoded. Assumption: a sentinel id, so the URL stays a real web URL.

### [ ] T-4.3 — Validate non-empty front and back

- **Depends on:** `T-4.1`, `T-4.2`
- **Size:** `S`
- **Why:** §6 Step 5 — "validate non-empty front and back". This is a trust boundary: the editor is
  the only place bad content enters the deck.
- **Do:**
  1. Reject whitespace-only as empty, not just the empty string.
  2. Inline message next to the offending field; block save while invalid.
  3. Trim on save.
- **Files / artifacts:** `app/edit/[id].tsx` (validation), `src/components/CardEditor.tsx` (message display)
- **Done when:** saving with either field blank is impossible, and the reason is visible.
- **Verify:** named UI observation — submit with a blank back and the form shows the error and does
  not add a card to the deck.
- **Evidence:** -
- **Blocks:** `T-4.11`

### [ ] T-4.4 — Wire soft delete with `deletedAt`

- **Depends on:** `T-1.11`, `T-2.10`
- **Size:** `S`
- **Why:** §4 Phase 3 feature 7 — soft delete; §1 calls `deletedAt` "free now, essential the moment
  sync exists". Review state must survive a delete.
- **Do:**
  1. Add a delete action in the editor (or the deck list) for custom cards.
  2. Set `deletedAt` via `softDeleteCard`; never remove the record.
  3. Exclude deleted cards from the session queue, the deck list, and every counter.
  4. Keep `ReviewState` for the deleted id — an undelete must not have lost progress.
- **Files / artifacts:** `app/cards.tsx`, `app/edit/[id].tsx`
- **Done when:** a deleted card disappears everywhere while its record remains in storage.
- **Verify:** `node -e` read of the persisted document, or a browser `localStorage` inspection, shows
  the card still present with a `deletedAt` value and its `reviews` entry intact.
- **Evidence:** -
- **Blocks:** `T-4.11`, `T-8.6`

### [ ] T-4.5 — Create `src/lib/deckIO.ts` — serialise the deck

- **Depends on:** `T-1.1`, `T-1.4`
- **Size:** `S`
- **Why:** §6 Step 5's export half. It must carry `schemaVersion` so an import can be validated rather
  than guessed at.
- **Do:**
  1. Export a function turning the full `PersistedState` into a versioned JSON string — cards
     **and** reviews, so an import restores progress too.
  2. Include `deletedAt` tombstones: a lossless round-trip means tombstones survive.
  3. Do not strip unknown fields — round-tripping must not quietly drop data.
- **Files / artifacts:** `src/lib/deckIO.ts`
- **Done when:** the function returns a string containing both maps and the schema version.
- **Verify:** the round-trip check in `T-4.7` passes.
- **Evidence:** -
- **Blocks:** `T-4.6`, `T-4.7`, `T-4.8`

### [ ] T-4.6 — Add parse and validation for import to `src/lib/deckIO.ts`

- **Depends on:** `T-4.5`, `T-1.4`
- **Size:** `M`
- **Why:** Import reads a file the app did not write. This is the one place malformed input could
  overwrite a working deck — input validation at a trust boundary, which the project rules say must
  not be skipped.
- **Do:**
  1. Parse and reject anything that is not a `PersistedState`-shaped object with the expected version,
     returning an error the UI can show.
  2. Handle a JSON syntax error as a normal rejection, not an exception that escapes.
  3. Never write a partial document — validate fully, then hand the result to `useDeck` to apply.
  4. Define the merge rule for an import over existing data (assumption: union by id, imported reviews
     win) and state it in the file so a later reader is not guessing.
- **Files / artifacts:** `src/lib/deckIO.ts`
- **Done when:** bad input is rejected with an error value and leaves storage untouched.
- **Verify:** the rejection cases in `T-4.7` pass.
- **Evidence:** -
- **Blocks:** `T-4.7`, `T-4.9`, `T-8.11`

### [ ] T-4.7 — Add `src/lib/deckIO.test.ts`

- **Depends on:** `T-4.6`, `T-4.5`
- **Size:** `M`
- **Why:** §7's DoD says "JSON export/import round-trips **losslessly**". That is a testable claim and
  the only way to know it holds is to compare the objects.
- **Do:**
  1. Round-trip a state containing seeds, custom cards, tombstones and non-default review state; assert
     deep equality, not a spot-check of two fields.
  2. Round-trip an empty deck.
  3. Assert rejection (not silent acceptance, not a throw) for: invalid JSON, a missing
     `schemaVersion`, a newer `schemaVersion`, and a `cards` value of the wrong type.
- **Files / artifacts:** `src/lib/deckIO.test.ts`
- **Done when:** all cases pass and removing the version check makes the suite fail.
- **Verify:** `npx jest src/lib/deckIO.test.ts --ci` exits 0.
- **Evidence:** -
- **Blocks:** `T-4.11`, `T-8.8`, `T-8.11`

### [ ] T-4.8 — Add the share-sheet dependency and wire export

- **Depends on:** `T-4.5`
- **Size:** `M`
- **Why:** §4 Phase 3 feature 7 — export the whole deck as JSON "via the OS share sheet". §0.D1 calls
  this the belt-and-braces substitute for sync.
- **Do:**
  1. Install the Expo sharing/filesystem packages (see Open question 5) and record the versions.
  2. Write the JSON to a file in the app's cache/document directory and open the OS share sheet.
  3. On web, fall back to a browser download — there is no share sheet there.
  4. Guard the whole thing so a user cancelling the sheet is not an error state.
- **Files / artifacts:** `package.json`, `app/cards.tsx` (the trigger), a small helper beside `deckIO.ts`
- **Done when:** export produces a JSON file the user can save on each platform.
- **Verify:** named UI observation — on web the browser downloads a `.json` file; in Expo Go the share
  sheet opens; the downloaded file parses as JSON with `schemaVersion` present.
- **Evidence:** -
- **Blocks:** `T-4.10`, `T-4.11`

### [ ] T-4.9 — Add the document-picker dependency and wire import

- **Depends on:** `T-4.6`
- **Size:** `M`
- **Why:** §6 Step 5's import half — the only path back from an export, so a reinstall is recoverable.
- **Do:**
  1. Install the Expo document-picker package and record the version.
  2. Read the chosen file, pass its contents to `deckIO`'s parser, and apply on success only.
  3. Show the parser's error message on rejection; leave the deck untouched.
  4. On web, fall back to a file input.
- **Files / artifacts:** `package.json`, `app/cards.tsx`, the helper from `T-4.8`
- **Done when:** importing a valid file restores the deck and importing a bad one changes nothing.
- **Verify:** named UI observation — import the file exported in `T-4.8` and the deck matches;
  then import a hand-corrupted copy and the deck is unchanged with an error shown.
- **Evidence:** -
- **Blocks:** `T-4.10`, `T-4.11`, `T-8.11`

### [ ] T-4.10 — Add the editor entry points and Export/Import controls to the deck manager

- **Depends on:** `T-4.8`, `T-4.9`, `T-2.10`
- **Size:** `S`
- **Why:** §4 Phase 3 feature 8 lists a web hotkey for "new" and "edit"; on the phone the equivalent
  must be a reachable button (§2). Both need a visible home.
- **Do:**
  1. Add a "New card" control and a per-row "Edit" control to `app/cards.tsx`, linking to
     `app/edit/[id].tsx`.
  2. Add Export and Import controls.
  3. Keep them touch-reachable; the hotkey versions land in `T-5.9`.
- **Files / artifacts:** `app/cards.tsx`
- **Done when:** every one of the four controls navigates or triggers as labelled.
- **Verify:** named UI observation — New opens an empty editor, Edit opens a prefilled one, Export
  triggers a download/share, Import opens a picker.
- **Evidence:** -
- **Blocks:** `T-4.11`, `T-8.6`

### [ ] T-4.11 — Phase 4 gate — the deck survives a full round-trip

- **Depends on:** `T-4.3`, `T-4.4`, `T-4.7`, `T-4.10`
- **Size:** `M`
- **Why:** §6 Step 5 as one sequence: add → edit → delete → export → import, with progress intact.
- **Do:**
  1. Add a custom card, edit its back, export.
  2. Delete a **different** custom card, then import the exported file.
  3. Check the deck: the added/edited card is present, the deleted card is back, and existing review
     state is unchanged.
- **Files / artifacts:** none — verification only
- **Done when:** the imported deck matches the exported one and no review state was lost.
- **Verify:** named UI observation plus `npx jest src/lib/deckIO.test.ts --ci` passing.
- **Evidence:** -
- **Blocks:** `T-5.1`, `T-8.8`

---

## Phase 5 — Polish & ship

Maps to §6 Step 6, §4 Phase 3 features 6 and 8, and §9's interaction design. Nothing here adds
features — it makes the finished app usable, reachable and honest about motion.

### [ ] T-5.1 — Wire `srs.ts` into the session

- **Depends on:** `T-1.8`, `T-3.5`
- **Size:** `M`
- **Why:** §4 Phase 3 feature 6 — `dueAt = now + intervalDays`; correct → interval grows ×ease;
  incorrect → reset to 1 day and flag Need Practice.
- **Do:**
  1. On a verified answer, call `srs.ts` to compute the next `ReviewState` and persist it.
  2. Incorrect answers must also set `status: 'need-practice'` — the plan says both happen.
  3. Do not double-schedule: `T-3.5`'s manual status buttons and this automatic update must write one
     state, not two.
- **Files / artifacts:** `app/index.tsx`, `src/hooks/useSession.ts`
- **Done when:** answering updates `dueAt`/`intervalDays`/`ease` in the stored document.
- **Verify:** browser `localStorage` inspection of `syntax-gym/v1/state` after answering two cards
  correctly — the second card's `intervalDays` is larger than the first's.
- **Evidence:** -
- **Blocks:** `T-5.2`
- **Note:** an incorrect answer both schedules 1 day **and** flags Need Practice, so a check that
  covers only one of the two is incomplete. Real SM-2/FSRS scheduling is out of scope (§10).

### [ ] T-5.2 — Order the session queue: due → Need Practice → New

- **Depends on:** `T-5.1`, `T-2.8`
- **Size:** `M`
- **Why:** §4 Phase 3 feature 6's queue rule, and the mechanism behind §8's "the Need Practice list
  shrinks noticeably".
- **Do:**
  1. Build the queue as due items first, then Need Practice, then New.
  2. Within a bucket, keep a stable order so a session does not shuffle on every render.
  3. Keep the module and status filters applied on top.
- **Files / artifacts:** `src/hooks/useSession.ts`
- **Done when:** a deck with one due, one Need Practice and one New card orders exactly that way.
- **Verify:** named UI observation — craft that three-card state (via the editor and status buttons)
  and read the order the session presents; it matches due → Need Practice → New.
- **Evidence:** -
- **Blocks:** `T-5.13`

### [ ] T-5.3 — Make dark mode the default

- **Depends on:** `T-2.1`, `T-2.2`
- **Size:** `S`
- **Why:** §6 Step 6 — "Dark mode **by default** (it is a coding tool)."
- **Do:**
  1. Default the theme selection to dark regardless of the OS setting.
  2. Apply the tokens to every screen — the session, the deck manager and the editor, including the
     input and the feedback states from `T-3.4`.
  3. Set the native status bar and the web page background so there is no white flash on load.
- **Files / artifacts:** `src/theme/index.ts`, `app/_layout.tsx`
- **Done when:** every screen is dark on first load on web and on the phone.
- **Verify:** named UI observation — a cold load on web shows no white flash and all three screens are
  dark; the same on Expo Go.
- **Evidence:** -
- **Blocks:** `T-5.13`

### [ ] T-5.4 — Make the layout adaptive across phone, tablet and desktop web

- **Depends on:** `T-2.3`, `T-2.9`
- **Size:** `M`
- **Why:** §6 Step 6's adaptive layout, and §2's rule that the session screen must work with large
  thumb targets on a phone while `ModuleNav` becomes a sidebar on wide web.
- **Do:**
  1. Phone: tab strip, stacked, thumb-sized controls.
  2. Tablet: the same structure with a wider content column.
  3. Desktop web: `ModuleNav` as a sidebar, content centred, keyboard affordances visible.
  4. Verify no horizontal overflow or clipped control at any of the three widths.
- **Files / artifacts:** `src/components/ModuleNav.tsx`, `app/_layout.tsx`
- **Done when:** all three widths render without overflow or clipping.
- **Verify:** named UI observation at a phone width (~390 px), a tablet width (~820 px) and a desktop
  width (≥1280 px) in the browser; check the deck manager and the editor too, not just the session.
- **Evidence:** -
- **Blocks:** `T-5.13`, `T-8.10`

### [ ] T-5.5 — Add `accessibilityLabel` to every control

- **Depends on:** `T-2.9`, `T-3.4`, `T-4.10`
- **Size:** `M`
- **Why:** §9 — "every icon button gets `accessibilityLabel`; the flip card announces whether it is
  showing front or back."
- **Do:**
  1. Sweep every interactive element: module options, filter options, the status buttons, the check
     button, the mode toggle, the editor controls, export/import.
  2. Make the flip card announce the visible side and change the label when it flips.
  3. Label the mode toggle with the mode it will switch **to**, so the label is actionable.
- **Files / artifacts:** the components from Phase 2–4 and `app/index.tsx`
- **Done when:** no interactive element is unlabelled and the flip card's label tracks the side.
- **Verify:** named UI observation — on web, inspect the accessibility tree for the session screen and
  confirm each control has a name, including the flip card before and after flipping.
- **Evidence:** -
- **Blocks:** `T-5.13`, `T-7.4`
- **Placeholder detail (`ponytail:`):** labels only in v1, because that is what §9 asks for — no
  `accessibilityHint`, no live-region announcements, no focus-trap work. Ceiling: a screen-reader user
  gets names but no richer semantics. Upgrade path: revisit if the Lighthouse accessibility score in
  `T-7.4` is short of "sane".

### [ ] T-5.6 — Add focus order, visible focus rings and ≥44 pt targets

- **Depends on:** `T-5.5`
- **Size:** `M`
- **Why:** §6 Step 6 — "sane focus order, ≥44 pt targets"; §4 Phase 3 feature 8 — "visible focus
  rings". §2's keyboard-first claim is meaningless if you cannot see where focus is.
- **Do:**
  1. One clear primary action per screen; tab order follows visual order.
  2. Visible focus rings on web for every control that can receive focus — do not remove the default
     outline without replacing it.
  3. Bring any target smaller than 44 pt up to size, or grow its hit area.
- **Files / artifacts:** the components from Phase 2–4, `app/index.tsx`, `app/cards.tsx`
- **Done when:** tabbing through the session screen visits controls in reading order, each visibly
  focused, and no control is under 44 pt.
- **Verify:** named UI observation — tab through the session screen on web and note the order and the
  visible ring; measure the interactive boxes and confirm none is under 44 pt.
- **Evidence:** -
- **Blocks:** `T-5.13`, `T-7.4`, `T-8.10`

### [ ] T-5.7 — Create `src/hooks/useHotkeys.web.ts`

- **Depends on:** `T-2.9`
- **Size:** `M`
- **Why:** §1's "real trap": React Native has no `onKeyDown`, so this must be a platform-split file.
  §4 Phase 3 feature 8 lists the bindings: `Space` flip, `←/→` navigate, `1` Need Practice,
  `2` Mastered, `e` edit, `n` new.
- **Do:**
  1. Attach `window.addEventListener('keydown')` and clean up on unmount.
  2. Implement all six bindings.
  3. Ignore the keys while a text input or textarea has focus — otherwise typing `1` in Type mode
     would mark the card Need Practice instead of entering a character. This is the bug this file
     exists to prevent.
  4. Do not collide with browser shortcuts (`Space` scrolling the page must be suppressed when the
     card is focused).
- **Files / artifacts:** `src/hooks/useHotkeys.web.ts`
- **Done when:** the hook exists with the platform extension, so Metro picks it on web only.
- **Verify:** named UI observation after `T-5.9` — each of the six keys performs its action on web,
  and pressing `1` inside the Type-mode input types the character and changes no status.
- **Evidence:** -
- **Blocks:** `T-5.8`, `T-5.9`, `T-8.3`, `T-8.10`

### [ ] T-5.8 — Create `src/hooks/useHotkeys.native.ts`

- **Depends on:** `T-5.7`
- **Size:** `S`
- **Why:** §1 — "one 'cross-platform-looking' file will silently do nothing on device". Metro resolves
  the platform extension automatically; the native side must exist so imports resolve on device.
- **Do:**
  1. Create the native file as a no-op (or a hidden `TextInput` for an iPad with a hardware keyboard —
     §2 marks that as a nice-to-have, not a requirement).
  2. Keep the exported signature identical to the web file.
- **Files / artifacts:** `src/hooks/useHotkeys.native.ts`
- **Done when:** importing `useHotkeys` on device resolves and does nothing rather than crashing.
- **Verify:** `npx expo start` on the host, open Expo Go and load the session screen — no resolution
  error, and the app behaves exactly as before.
- **Evidence:** -
- **Blocks:** `T-5.9`, `T-8.10`
- **Placeholder detail (`ponytail:`):** the native file is a no-op because §2 marks hardware-keyboard
  support on iPad/Android as "⚠️ physical keyboard only" — an optional convenience. Ceiling: no
  shortcut support on a tablet with a keyboard. Upgrade path: add the hidden `TextInput` when a real
  keyboard user asks for it.

### [ ] T-5.9 — Wire hotkeys into the session screen

- **Depends on:** `T-5.7`, `T-5.8`, `T-5.2`
- **Size:** `M`
- **Why:** §4 Phase 3 feature 8 — the shortcuts are only worth having if they drive the real session
  actions, not a parallel set.
- **Do:**
  1. Call `useHotkeys` from the session screen and map each key to the existing action (flip, next,
     previous, status, edit, new).
  2. Reuse the same handlers the buttons call — no duplicate logic.
  3. On native, the import must resolve to the no-op with no behavioural change.
- **Files / artifacts:** `app/index.tsx`
- **Done when:** every shortcut performs the same action as its button.
- **Verify:** named UI observation on web — flip with `Space`, advance with `→`, go back with `←`,
  mark with `1`/`2`, open the editor with `e`/`n`, each matching the button behaviour.
- **Evidence:** -
- **Blocks:** `T-5.13`, `T-8.3`, `T-8.10`

### [ ] T-5.10 — Respect reduced motion

- **Depends on:** `T-2.5`
- **Size:** `S`
- **Why:** §9 — "respect `prefers-reduced-motion` on web and the OS reduce-motion setting on native;
  the flip animation degrades to an instant swap."
- **Do:**
  1. Read the web media query and the native reduced-motion setting.
  2. Degrade the flip to an instant swap when either is set.
  3. Apply to every animated transition, not just the flip — including the mode toggle.
- **Files / artifacts:** `src/components/FlipCard.tsx`, a small hook or helper in `src/theme/`
- **Done when:** flipping is instant with reduced motion on, animated with it off.
- **Verify:** named UI observation — enable reduced motion (browser devtools emulation and the OS
  setting on a device) and confirm the flip is an instant swap with no transition.
- **Evidence:** -
- **Blocks:** `T-5.13`, `T-7.4`

### [ ] T-5.11 — Autofocus Type Mode and keep one primary action per screen

- **Depends on:** `T-3.2`, `T-5.6`
- **Size:** `S`
- **Why:** §9's focus-management rule: "Type Mode autofocuses its input; the session screen keeps one
  clear primary action."
- **Do:**
  1. Focus the input when Type Mode is entered, and on advancing to the next card.
  2. Do not steal focus on the Flip-mode screen — a keyboard popping up over a flip card is the
     failure this rule prevents.
  3. Make the Check button the visually primary action in Type Mode.
- **Files / artifacts:** `app/index.tsx`, `src/components/ActiveInput.tsx`
- **Done when:** entering Type Mode focuses the input on web and on the phone, and Flip mode does not.
- **Verify:** named UI observation — toggle to Type and the caret is in the input; toggle back to Flip
  and no soft keyboard appears on the device.
- **Evidence:** -
- **Blocks:** `T-5.13`

### [ ] T-5.12 — Write `README.md`

- **Depends on:** `T-0.12`, `T-7.3`
- **Size:** `M`
- **Why:** §3 ends with "use the cheapest loop" and a three-row table nobody will remember. The plan's
  own Docker caveats (no `.ipa` from Compose, `HOST_IP` for `web-dev`) are the difference between a
  working setup and a confusing one for the next session.
- **Do:**
  1. Document the three dev loops from §3 verbatim — host `npx expo start` for device iteration, the
     `HOST_IP=... docker compose --profile dev up web-dev` loop, and
     `docker compose up --build` for the release check.
  2. State plainly that Docker ships the **web** surface only, and that the Android app is built
     locally into an APK and sideloaded (§0.D5, `BUILD.md`) — including the "do not expect an `.apk`
     from `docker compose`" warning, and that iOS is deferred.
  3. List the environment variables from this file's table.
  4. Record the architecture at a glance (§1's `src/` layout) and the data model's two design calls
     (content/progress split, `schemaVersion`).
- **Files / artifacts:** `README.md`
- **Done when:** a reader can go from a clean checkout to a running web app and a running phone app
  using only the README.
- **Verify:** follow the README from scratch in a fresh shell — each command runs as written and the
  documented outcome occurs.
- **Evidence:** -
- **Blocks:** `T-5.13`

### [ ] T-5.13 — Phase 5 gate — the polish is real, not aspirational

- **Depends on:** `T-5.2`, `T-5.5`, `T-5.9`, `T-5.11`, `T-5.12`
- **Size:** `M`
- **Why:** Everything in this phase is a claim about behaviour under a specific condition
  (keyboard present, reduced motion on, screen reader on). Each needs its condition actually set.
- **Do:**
  1. On desktop web: run the full session by keyboard only, with focus rings visible.
  2. With reduced motion enabled: flip is instant.
  3. On a phone: complete a full session by touch only, no keyboard.
  4. Check the deck manager and the editor are dark and adaptive at phone width.
- **Files / artifacts:** none — verification only
- **Done when:** all four hold.
- **Verify:** named UI observations for each of the four, recorded with which platform and which
  setting was active.
- **Evidence:** -
- **Blocks:** `T-6.1`, `T-7.4`

---

## Phase 6 — Native Android delivery: local APK → Google Drive or USB

Maps to §6 Step 6's last bullet and §0.D5. The Android app ships as a plain **APK built on this
machine** — no EAS, no Expo account, no Play Store. iOS is deferred by decision (§0.D5), so it has no
tasks here; the codebase stays multiplatform so that path remains open.

The instruction for this phase is `BUILD.md`, which was written **before** the build path was ever
exercised. `T-6.7` verifies that document rather than trusting it.

### [x] T-6.1 — Install a JDK (manual — needs `sudo`)

- **Depends on:** none
- **Size:** `S`
- **Why:** Gradle needs a JDK to compile. This machine has a complete Android SDK but **no Java at
  all** — no `java` on `PATH`, nothing in `/usr/lib/jvm`, no Android Studio bundle. This is the single
  blocking prerequisite for the whole Android path.
- **Do:**
  1. Run `sudo apt install openjdk-17-jdk-headless` yourself — it needs privilege escalation, and no
     agent may run it.
  2. Install the **JDK**, not the JRE. The `-jre-headless` package apt suggests is not enough: a JRE
     has no `javac`, and Gradle fails with `Could not find tools.jar`.
- **Files / artifacts:** none — system package
- **Done when:** `java -version` reports an OpenJDK 17 or 21 build.
- **Verify:** `java -version` prints `openjdk version "17...` (or `21...`).
- **Evidence:** `sudo apt install openjdk-17-jdk-headless` installed 17.0.20.1+1-1~24.04 (272 MB).
  `java -version` → `openjdk version "17.0.20.1" 2026-08-18`; `javac -version` → `javac 17.0.20.1`
  (proves a JDK, not a JRE); `keytool` present; `/etc/ssl/certs/java/cacerts` present.
  The log's `ca-certificates-java: No JRE found. Skipping Java certificates setup.` is benign —
  the later `ca-certificates-java` trigger re-ran and added all certs.
- **Blocks:** `T-6.3`

### [x] T-6.2 — Point the toolchain at the existing Android SDK

- **Depends on:** none
- **Size:** `S`
- **Why:** `ANDROID_HOME` is unset, so Gradle cannot find the SDK at `~/Android/Sdk`, and `adb` is not
  on `PATH`. Both the build and the USB install route depend on this.
- **Do:**
  1. Add `export ANDROID_HOME="$HOME/Android/Sdk"` and
     `export PATH="$PATH:$ANDROID_HOME/platform-tools"` to `~/.bashrc`.
  2. Reload the shell.
  3. Note that `~/Android/Sdk/licenses/` already exists, so SDK licence acceptance is done — if
     Gradle complains about licences, the cause is something else.
- **Files / artifacts:** `~/.bashrc`
- **Done when:** a fresh shell has `ANDROID_HOME` set and `adb` on `PATH`.
- **Verify:** in a **new** shell, `echo "$ANDROID_HOME"` prints `/home/adminpaws/Android/Sdk` and
  `adb version` prints a version banner.
- **Evidence:** Appended to the end of `~/.bashrc` (after the existing `nvm` block):
  `export ANDROID_HOME="$HOME/Android/Sdk"` and `export PATH="$PATH:$ANDROID_HOME/platform-tools"`.
  Verified in a new shell (`bash -ic`): `ANDROID_HOME=/home/adminpaws/Android/Sdk` — the exact
  expected value, and `adb version` → `Android Debug Bridge version 1.0.41`, `Version 37.0.0-14910828`,
  `Installed as /home/adminpaws/Android/Sdk/platform-tools/adb`. `~/Android/Sdk/licenses/` confirmed
  present beforehand, so SDK licence acceptance is genuinely done.
- **Note:** the block sits **after** the file's non-interactive guard (`case $- in *i*) ;; *) return;; esac`,
  line 5 — the same convention as the `nvm` block. A new **interactive** terminal therefore has both,
  but a non-interactive `bash -c '...'` does **not**, because `.bashrc` returns before reaching the
  end. Gradle still finds the SDK in that case: `expo prebuild` writes `android/local.properties`
  with `sdk.dir`.
- **Blocks:** `T-6.3`, `T-6.4`

### [ ] T-6.3 — Build the first release APK

- **Depends on:** `T-6.1`, `T-6.2`, `T-0.5`
- **Size:** `M`
- **Why:** The APK is the deliverable. `assembleRelease` bundles the JavaScript into the file, which
  is what makes it standalone and safe to put on Google Drive.
- **Do:**
  1. Run `npx expo prebuild --platform android` to generate `android/`.
  2. Run `cd android && ./gradlew assembleRelease`.
  3. Expect the first run to download Gradle and dependencies — several minutes. Do not interrupt it.
  4. Do **not** substitute a debug build: it ships no bundled JS and needs a live Metro server, so it
     is useless from Drive.
- **Files / artifacts:** `android/` (generated), `android/app/build/outputs/apk/release/app-release.apk`
- **Done when:** the release APK exists and its JavaScript is genuinely bundled in.
- **Verify:** `ls -lh android/app/build/outputs/apk/release/app-release.apk` shows a file of tens of MB
  (not a few KB), **and** `unzip -l <apk> | grep -c index.android.bundle` is ≥ 1.
- **Evidence:** -
- **Blocks:** `T-6.4`, `T-6.5`
- **Note:** `android/` is generated, not source, and must not be committed — see Open question 16.
- **Note:** This needs an app to build. `T-0.5` is the minimum, and the *shippable* build is only
  meaningful once `T-5.13` has passed. `T-0.14` proves this same Gradle path against the bare scaffold
  first, so a toolchain problem surfaces in Phase 0 instead of here.

### [ ] T-6.4 — Install the APK over USB with `adb`

- **Depends on:** `T-6.3`, `T-6.2`
- **Size:** `M`
- **Why:** The first of the two routes §0.D5 promises, and the one that needs no Google account, no
  upload, and no unknown-sources permission.
- **Do:**
  1. On the phone, unlock Developer options: Settings → About phone → tap **Build number** seven times.
  2. Enable **USB debugging** under Developer options.
  3. Connect by USB and accept the RSA prompt on the phone.
  4. Confirm the device shows as `device`, not `unauthorized`. Install with `-r` so later builds can
     be laid over this one.
- **Files / artifacts:** none — device install
- **Done when:** the app appears in the phone's launcher and opens with Metro **not** running.
- **Verify:** `adb devices` lists the phone as `device`, `adb install -r <apk>` prints `Success`, and
  the app launches from the launcher with this machine's dev server stopped.
- **Evidence:** -
- **Blocks:** `T-6.6`

### [ ] T-6.5 — Deliver through Google Drive and install from the phone

- **Depends on:** `T-6.3`
- **Size:** `M`
- **Why:** The second route §0.D5 promises, and the whole reason for choosing an APK over a store: it
  needs no cable, no developer tools on hand, and no account.
- **Do:**
  1. Upload `app-release.apk` to Google Drive.
  2. On the phone, download it with the **Drive app** rather than a browser — Chrome and Files often
     refuse to open an APK from Drive.
  3. Open the downloaded file and allow installs from that source when Android asks.
- **Files / artifacts:** none — external delivery step
- **Done when:** the app installs from a Drive download, with no cable and no `adb`.
- **Verify:** named UI observation on the phone: the download completes, the installer prompt appears,
  and the app launches from the launcher afterwards — with this machine switched off or disconnected.
- **Evidence:** -
- **Blocks:** `T-6.6`
- **Note:** if Android refuses with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the signing key differs from
  the installed copy. Uninstalling clears the app's stored cards, so export the deck to JSON first
  (§0.D5) — that is the export/import built in Phase 4.

### [ ] T-6.6 — Prove the APK runs standalone

- **Depends on:** `T-6.4`, `T-6.5`
- **Size:** `M`
- **Why:** A release APK that still depends on a dev server is the failure mode that makes Drive
  delivery look broken. §7's DoD names this explicitly.
- **Do:**
  1. Stop the Metro dev server on this machine entirely.
  2. Disconnect the phone from USB and put it in aeroplane mode.
  3. Launch the app and complete a full session: flip, Type mode, a status change.
  4. Add a custom card, fully close the app, and reopen it.
- **Files / artifacts:** none — device verification
- **Done when:** every feature works with no dev server, no cable and no network.
- **Verify:** named UI observation on the phone in aeroplane mode with the dev server stopped — the
  app launches to the session screen (not a red error screen), flip and typing both work, and a new
  custom card survives a full app restart.
- **Evidence:** -
- **Blocks:** `T-6.7`, `T-6.8`

### [ ] T-6.7 — Verify `BUILD.md` end to end from a clean shell

- **Depends on:** `T-6.6`
- **Size:** `M`
- **Why:** `BUILD.md` is the instruction the user asked for, and it was written **before** the build
  path was exercised, so its commands are currently untested. A guide that does not work is worse than
  no guide.
- **Do:**
  1. Follow `BUILD.md` from a fresh shell, starting from the state its "what is already here" table
     describes.
  2. Compare each command's real output against what the document claims.
  3. Correct anything that differs — a wrong path, a missing flag, an error the troubleshooting table
     does not cover.
  4. Update the "What is verified, and what is not" section at the end of the file to reflect what
     was actually confirmed.
- **Files / artifacts:** `BUILD.md`
- **Done when:** someone can go from the documented starting state to an installed app using only
  `BUILD.md`, and its unverified markers say what was really established.
- **Verify:** a from-scratch run of `BUILD.md` reaching an installed, launching app, with every
  deviation from the text either fixed in the file or added to its troubleshooting table.
- **Evidence:** -
- **Blocks:** `T-6.8`

### [ ] T-6.8 — Phase 6 gate — the sideloaded APK is the shipping deliverable

- **Depends on:** `T-6.7`
- **Size:** `S`
- **Why:** §0.D5 trades a cloud build for a local one, and that trade only pays back if the APK is
  genuinely usable as the primary way the app reaches the phone.
- **Do:**
  1. Confirm **both** routes install the same build: `adb install -r` over USB, and a Drive download.
  2. Confirm no Expo account was needed anywhere in the path — no `eas` command was run at all.
  3. Confirm the web surface from Phase 0 is unaffected: still `docker compose up --build`, still
     `:8080`.
- **Files / artifacts:** none — verification only
- **Done when:** the same APK installs by both routes, no Expo account was involved, and the web
  surface still works.
- **Verify:** the USB install and the Drive install both launch the app on the phone, `command -v eas`
  still reports `MISSING` (proving no EAS dependency was introduced), and `docker compose ps` still
  shows `web healthy`.
- **Evidence:** -
- **Blocks:** `T-7.1`, `T-8.2`

---

## Phase 7 — Verifiable gates

Maps to §6 Step 7. "Run these; do not assume them." These tasks are themselves the checks, so the
phase's completion criterion is all five.

### [ ] T-7.1 — Pass the `ci` gate

- **Depends on:** `T-4.7`, `T-6.8`, `T-0.10`
- **Size:** `S`
- **Why:** §6 Step 7 line 1 and §7's DoD line 7 — the reproducible typecheck + test + export gate.
- **Do:**
  1. Run the CI profile as a one-shot container.
  2. If it fails on the export step, suspect `web.output` (see `T-0.2`) before suspecting the app.
- **Files / artifacts:** none — verification only
- **Done when:** the container exits 0 having run typecheck, tests and the web export.
- **Verify:** `docker compose --profile ci run --rm ci` exits 0, and its output shows the typecheck,
  the Jest summary and the export all completing.
- **Evidence:** -
- **Blocks:** `T-7.5`, `T-8.7`

### [ ] T-7.2 — Pass the production container smoke test

- **Depends on:** `T-5.13`, `T-7.1`
- **Size:** `M`
- **Why:** §6 Step 7 line 2 — the whole point of the Docker work: the production web build loads,
  flips, and persists. §3 also asks for the `read_only`/`tmpfs` mounts to be verified on first run.
- **Do:**
  1. Run `docker compose up --build -d` and wait for `healthy`.
  2. Load `:8080`, flip a card, add a custom card, reload, confirm persistence.
  3. Check the nginx logs for write errors. If nginx needs a writable path outside
     `/var/cache/nginx` and `/var/run`, drop `read_only: true` (or add the path to `tmpfs`) and say
     which in the Evidence line.
- **Files / artifacts:** `docker-compose.yml` (only if `read_only` must be relaxed)
- **Done when:** the production build passes the loop and nginx logs no write errors.
- **Verify:** `docker compose ps --format '{{.Service}} {{.Health}}'` shows `web healthy`; a browser
  session at `http://127.0.0.1:8080/` flips a card, adds a custom card, survives a reload; nginx logs
  contain no permission-denied lines.
- **Evidence:** -
- **Blocks:** `T-7.5`, `T-8.7`

### [ ] T-7.3 — Verify the containerised dev loop

- **Depends on:** `T-0.12`, `T-7.2`
- **Size:** `M`
- **Why:** §3 offers this loop as "verifying in the same base image you will deploy", and it only
  works if `REACT_NATIVE_PACKAGER_HOSTNAME` is set. Unset, Metro advertises the container IP and the
  host browser cannot load the bundle.
- **Do:**
  1. Export `HOST_IP` from the LAN IP (or set it in `.env`).
  2. Run `docker compose --profile dev up web-dev`.
  3. Load the dev server from the host browser and confirm the bundle loads, not just the HTML shell.
- **Files / artifacts:** none — verification only
- **Done when:** the bundle loads and hot reload works from the host browser.
- **Verify:** the browser at `http://$HOST_IP:8081` loads the app with no bundle-resolution error in
  the console; edit a component and see the change without a manual rebuild.
- **Evidence:** -
- **Blocks:** `T-7.5`

### [ ] T-7.4 — Run Lighthouse against the container

- **Depends on:** `T-5.5`, `T-5.6`, `T-5.10`, `T-7.2`
- **Size:** `M`
- **Why:** §6 Step 7 line 4 — "sane performance and accessibility scores". It is also the only
  automated backstop for the accessibility work in Phase 5.
- **Do:**
  1. Run Lighthouse against `http://127.0.0.1:8080/` on the production container.
  2. Record the performance and accessibility scores and the specific failing audits.
  3. Fix only the findings that trace back to something the plan asks for (labels, focus order,
     targets, contrast against the dark theme) — do not chase a score.
- **Files / artifacts:** the components named by whichever audits fail, if any do
- **Done when:** performance and accessibility are both judged sane, with the numbers recorded.
- **Verify:** Lighthouse run recorded with both scores and the list of remaining failing audits
  (accepting none, or naming each with why it is acceptable).
- **Evidence:** -
- **Blocks:** `T-7.5`

### [ ] T-7.5 — Phase 7 gate — all gates pass from a clean build

- **Depends on:** `T-7.1`, `T-7.2`, `T-7.3`, `T-7.4`
- **Size:** `M`
- **Why:** Docker layer caching can let a broken Dockerfile or a stale dependency layer pass every
  gate. §7's DoD claims `docker compose up` works; that claim is only true from a cold cache.
- **Do:**
  1. Tear down, then rebuild with `docker compose build --no-cache`.
  2. Re-run the `ci` profile, the production smoke test and the Lighthouse run.
  3. Re-run the dev profile check.
- **Files / artifacts:** none — verification only
- **Done when:** all four gates pass against images built from scratch, with no cache reuse.
- **Verify:** `docker compose build --no-cache` completes, then `docker compose --profile ci run --rm ci`
  exits 0 and the browser smoke test passes again.
- **Evidence:** -
- **Blocks:** `T-8.7`

---

## Phase 8 — End-to-end acceptance (maps to the plan's success criteria)

§7's Definition of Done, one checkbox per line, plus §8's one measurable success metric and the
negative cases the plan's error handling implies.

### [ ] T-8.1 — Four modules seeded with the exact 17 concepts

- **Depends on:** `T-1.2`, `T-2.9`
- **Size:** `S`
- **Do:** On a fresh install (cleared storage), open the app and walk each of the four modules.
- **Done when:** Containers 4, JS/TS 5, PHP/Laravel 4, SQL 4 — 17 total, with fronts and backs
  matching §5's tables character for character, including the intentionally JS-phrased `??` card.
- **Verify:** compare the on-screen front/back text against §5's tables for all 17; `grep -c "id: 'seed-"`
  on `src/lib/seedCards.ts` is 17.
- **Evidence:** -
- **Blocks:** `T-8.2`

### [ ] T-8.2 — One codebase runs on Web + Android

- **Depends on:** `T-6.8`, `T-7.2`, `T-8.1`
- **Size:** `M`
- **Do:** Launch the same source on both v1 ship targets — the container's web build at `:8080`, and
  the sideloaded release APK on a real phone. Confirm there is no platform-specific fork in the code,
  beyond the two deliberate platform splits (`useHotkeys.web/native` and the monospace font stack).
- **Done when:** the same deck, same session screen and same behaviour on both, and iOS remains
  reachable from the same codebase once an Apple developer account exists (§0.D5).
- **Verify:** named UI observation on web and on the phone, each showing the 17 seeds and a working
  flip. Record in the Evidence line that iOS was **not** verified, and why — deferred by §0.D5, not
  failing.
- **Evidence:** -
- **Blocks:** `T-8.3`

### [ ] T-8.3 — Flip works by touch, gesture, and (web) keyboard

- **Depends on:** `T-8.2`, `T-5.9`
- **Size:** `S`
- **Do:** Flip by tapping; flip by swipe/drag; flip with `Space` on desktop web; navigate with
  `←`/`→`.
- **Done when:** all three input methods work, and none of them conflicts with the others on the same
  card.
- **Verify:** named UI observation for each method, naming the platform used for each.
- **Evidence:** -
- **Blocks:** `T-8.10`

### [ ] T-8.4 — Active typing mode with correct/incorrect feedback and exact-syntax comparison

- **Depends on:** `T-3.6`, `T-8.2`
- **Size:** `M`
- **Do:** Switch to Type mode and answer one card correctly, one with a punctuation change, one with
  only indentation differences.
- **Done when:** the punctuation change is judged incorrect, the indentation change is judged correct,
  and the incorrect case shows the expected answer.
- **Verify:** named UI observations for all three cases, on web and on the device.
- **Evidence:** -
- **Blocks:** `T-8.10`

### [ ] T-8.5 — Status buttons and filtering by status

- **Depends on:** `T-2.10`, `T-8.1`
- **Size:** `S`
- **Do:** Mark one card Need Practice and one Mastered, then exercise each of
  `All | New | Need Practice | Mastered` in the deck manager.
- **Done when:** each filter shows exactly the matching cards and the "X left in Need Practice"
  counter agrees with the list.
- **Verify:** named UI observation for each of the four filters, with the counter value compared
  against the visible row count.
- **Evidence:** -
- **Blocks:** `T-8.6`

### [ ] T-8.6 — Custom cards can be added, edited, deleted and persist on Web and Android

- **Depends on:** `T-4.11`, `T-8.5`, `T-6.8`
- **Size:** `M`
- **Do:** On each v1 ship target: add a custom card, edit its back, soft-delete it, then reload and
  restart the app.
- **Done when:** the add and edit survive a reload and a cold restart; the deleted card is gone from
  the UI; and it can be recovered by importing the export taken before deletion.
- **Verify:** named UI observation per platform, including a full app restart (not a browser reload)
  on the phone with Metro stopped.
- **Evidence:** -
- **Blocks:** `T-8.8`

### [ ] T-8.7 — `docker compose up` serves the production web build, and `--profile ci` passes

- **Depends on:** `T-7.5`
- **Size:** `S`
- **Do:** From the repo root with no prior containers: `docker compose up --build -d`, then
  `docker compose --profile ci run --rm ci`.
- **Done when:** `:8080` serves the app and the CI profile exits 0.
- **Verify:** the two commands above, with `docker compose ps` showing `web healthy` between them.
- **Evidence:** -
- **Blocks:** `T-8.9`

### [ ] T-8.8 — JSON export/import round-trips losslessly

- **Depends on:** `T-8.6`, `T-4.11`
- **Size:** `M`
- **Do:** Export a deck that contains seeds, custom cards, a soft-deleted card and non-default review
  state; import it into a freshly cleared install.
- **Done when:** the restored deck matches the exported one, including tombstones and per-card review
  state — not just the card text.
- **Verify:** compare the restored state against the exported JSON; every review entry's
  `status`/`intervalDays`/`dueAt` matches, and the tombstoned card is still tombstoned.
- **Evidence:** -
- **Blocks:** `T-8.11`

### [ ] T-8.9 — No backend required and no runtime network call

- **Depends on:** `T-8.7`, `T-6.8`
- **Size:** `S`
- **Do:** Load the app with no network available — the container serving over localhost only, and the
  native build in aeroplane mode.
- **Done when:** every feature works with no outbound request, and the source contains no API client,
  no fetch to a service, and no CORS configuration (which would indicate a backend crept in).
- **Verify:** run a full session offline on both surfaces; `grep -rn "fetch(\|axios" src/ app/` returns
  nothing that targets a remote host. Note: `expo export` and Gradle network use is build-time, not
  runtime, and does not count.
- **Evidence:** -
- **Blocks:** `T-8.10`

### [ ] T-8.10 — Keyboard-friendly on desktop web, gesture-friendly on mobile

- **Depends on:** `T-8.3`, `T-8.4`, `T-8.9`, `T-5.13`
- **Size:** `M`
- **Do:** Complete a full session on desktop web **without touching the mouse**. Then complete a full
  session on the phone **without any keyboard**.
- **Done when:** neither run is blocked by a missing input method, and the focus ring is visible
  throughout the keyboard run.
- **Verify:** named UI observations for both runs, including every shortcut used in the keyboard run
  and every touch target used in the phone run.
- **Evidence:** -
- **Blocks:** `T-8.12`

### [ ] T-8.11 — Negative cases fail safely

- **Depends on:** `T-8.8`, `T-4.9`
- **Size:** `M`
- **Why:** The plan mentions error handling in two places — import validation (`T-4.6`) and the
  incorrect-answer path. Both must fail without destroying data, and neither is proven by a happy-path
  run.
- **Do:**
  1. Import: a file that is not JSON, a JSON file without `schemaVersion`, and a JSON file with a
     future `schemaVersion`. After each, confirm the existing deck is byte-identical.
  2. Typing: submit an empty answer and an answer with a changed bracket; confirm neither incorrectly
     advances mastery (no `intervalDays` growth, no Mastered status) and that review state is not
     corrupted.
  3. Delete then reload: confirm a soft-deleted card does not reappear in the session queue while its
     `reviews` entry survives in storage.
- **Done when:** all three groups fail safely, with an error surfaced for the import cases rather than
  silence.
- **Verify:** for each case, capture the stored document before and after and show it is unchanged
  where it should be; `npx jest src/lib/deckIO.test.ts --ci` covers the parse cases.
- **Evidence:** -
- **Blocks:** `T-8.12`

### [ ] T-8.12 — Timed: adding a card after a real blank takes under 15 seconds

- **Depends on:** `T-8.10`, `T-8.11`
- **Size:** `S`
- **Why:** §8's one hard, personal success metric: "Adding a new card after a real coding blank takes
  **< 15 seconds** on any device." It is the metric that decides whether the app gets used at all, and
  it only holds with a keyboard (web) or a large touch target (phone) — so it must be timed on both.
- **Do:**
  1. On desktop web: start the clock on the session screen, add a card for a syntax you actually
     blanked on, and stop when it is saved.
  2. Repeat on the phone.
  3. Repeat on the phone a second time, this time with the app cold — startup counts toward the
     15 seconds, which is the realistic case.
- **Done when:** all three runs are under 15 seconds, or the failing run is reported with the actual
  time so the friction can be fixed.
- **Verify:** three timed runs with the measured seconds recorded, naming the device and whether the
  app was warm or cold.
- **Evidence:** -
