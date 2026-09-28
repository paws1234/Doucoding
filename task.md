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
| 0 — Scaffold: two surfaces from minute one | 14 | 0 / 14 | in progress |
| 1 — Data layer | 12 | 0 / 12 | not started |
| 2 — Core UI: flip + persist | 12 | 0 / 12 | not started |
| 3 — Active typing mode | 6 | 0 / 6 | not started |
| 4 — Card editor, export & import | 11 | 0 / 11 | not started |
| 5 — Polish & ship | 13 | 0 / 13 | not started |
| 6 — Native Android delivery: local APK → Drive or USB | 8 | 1 / 8 | in progress |
| 7 — Verifiable gates | 5 | 0 / 5 | not started |
| 8 — End-to-end acceptance | 12 | 0 / 12 | not started |

**Overall:** 1 / 93 done

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

### [ ] T-0.1 — Scaffold the Expo app with TypeScript and expo-router

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
- **Evidence:** -
- **Blocks:** `T-0.2`, `T-0.3`, `T-0.6`, `T-0.8`, `T-1.1`

### [ ] T-0.2 — Set `app.json` web output to `single`

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
- **Evidence:** -
- **Blocks:** `T-0.8`, `T-7.1`

### [ ] T-0.3 — Install NativeWind and Tailwind, add config and global stylesheet

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
- **Evidence:** -
- **Blocks:** `T-0.4`, `T-2.1`

### [ ] T-0.4 — Wire NativeWind into Babel and Metro, import the stylesheet in the root layout

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
- **Evidence:** -
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

### [ ] T-0.6 — Add the Jest test harness

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
- **Evidence:** -
- **Blocks:** `T-0.7`, `T-1.4`, `T-1.6`, `T-1.8`, `T-4.7`

### [ ] T-0.7 — Add the `verify` script to `package.json`

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
- **Evidence:** -
- **Blocks:** `T-0.10`, `T-7.1`

### [ ] T-0.8 — Add `docker/web.Dockerfile`

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
- **Evidence:** -
- **Blocks:** `T-0.9`, `T-0.10`, `T-0.13`

### [ ] T-0.9 — Add `docker/nginx.conf`

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
- **Evidence:** -
- **Blocks:** `T-0.10`, `T-0.13`

### [ ] T-0.10 — Add `docker-compose.yml` with `web`, `web-dev` and `ci`

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
- **Evidence:** -
- **Blocks:** `T-0.12`, `T-0.13`, `T-7.1`, `T-7.3`

### [~] T-0.11 — Add `.dockerignore` and extend `.gitignore`

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
  not merely listed in a `.gitignore`. **Still missing: `.dockerignore`**, so the task stays open.
- **Note:** `git check-ignore android` (bare name, no trailing slash) does **not** match an
  `android/` directory-only pattern, because git cannot tell the path is a directory. Check a real
  path *under* it instead — the tree itself is genuinely ignored.
- **Note:** The prompt files are ignored as `.github/prompts/`, **not** all of `.github/`, so a
  GitHub Actions workflow can still be added at `.github/workflows/` without `git add -f`. Confirm
  with `git check-ignore -q .github/workflows/ci.yml` → must report **NOT** ignored.
- **Blocks:** `T-0.13`

### [ ] T-0.12 — Add `.env.example` documenting `HOST_IP`

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
- **Evidence:** -
- **Blocks:** `T-7.3`

### [ ] T-0.13 — Phase 0 gate — the container serves a web build

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
- **Evidence:** -
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

---

## Phase 1 — Data layer

Maps to §6 Step 2. Content and progress are separate maps, `schemaVersion` + `migrate()` exist from
day one, and `normalize.ts` is the single comparison rule the typing mode will use.

### [ ] T-1.1 — Create `src/types/card.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.2`, `T-1.3`, `T-1.9`, `T-2.3`

### [ ] T-1.2 — Create `src/lib/seedCards.ts` with the exact 17 cards

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
- **Evidence:** -
- **Blocks:** `T-1.9`, `T-8.1`

### [ ] T-1.3 — Create `src/lib/storage.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.4`, `T-1.5`, `T-1.9`

### [ ] T-1.4 — Add `schemaVersion` handling and `migrate()` to `src/lib/storage.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.5`, `T-1.9`, `T-4.6`

### [ ] T-1.5 — Add `src/lib/storage.test.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.11`

### [ ] T-1.6 — Create `src/lib/normalize.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.7`, `T-3.1`, `T-3.3`

### [ ] T-1.7 — Add `src/lib/normalize.test.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.11`, `T-3.3`, `T-8.4`

### [ ] T-1.8 — Create `src/lib/srs.ts`

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
- **Evidence:** -
- **Blocks:** `T-1.9`, `T-2.8`, `T-5.1`
- **Note:** `srs.ts` is written here but is **not** wired into the session until `T-5.1`; Phase 2's
  queue is status-only so the flip loop can be proven first.

### [ ] T-1.9 — Add `src/lib/srs.test.ts`

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
- **Evidence:** -
- **Blocks:** `T-5.1`, `T-5.2`

### [ ] T-1.10 — Create `src/hooks/useDeck.ts` — hydrate and merge

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
- **Evidence:** -
- **Blocks:** `T-1.11`, `T-2.2`, `T-2.9`

### [ ] T-1.11 — Add mutations and debounced persist to `src/hooks/useDeck.ts`

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
- **Evidence:** -
- **Blocks:** `T-2.9`, `T-2.10`, `T-4.4`

### [ ] T-1.12 — Phase 1 gate — the data layer is provably sound

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
- **Evidence:** -
- **Blocks:** `T-2.2`

---

## Phase 2 — Core UI: flip + persist

Maps to §6 Step 3 and §4 Phase 1 (features 1–4). The smallest end-to-end path that proves the app
works: a card that flips, a status that sticks, a filter that shows it.

### [ ] T-2.1 — Create the theme tokens in `src/theme/`

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
- **Evidence:** -
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

### [ ] T-6.2 — Point the toolchain at the existing Android SDK

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
- **Evidence:** -
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
