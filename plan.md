# Plan: Custom Syntax Flashcard App ("Syntax Gym")

**Goal**  
A cross-platform active-recall gym for code syntax atoms — **one React Native (Expo) codebase targeting Web, iOS and Android**, of which **v1 ships Web and Android** (iOS is deferred, §0.D5). Bridges real-world development logic with syntax muscle memory to reduce interview anxiety and "blank screen" panic.

**Core Concept**  
Flashcards focused on minimal, exact syntax. Support both passive flip-and-reveal and active typing modes. Persist custom cards and mastery status on the device.

**Platform decision**  
React Native is chosen *because* you want real phone apps plus the web from one codebase. The trade-off is explicit and accepted: only the **web** surface is containerisable, and the Android app is built locally as an APK rather than through a store or a cloud build. See §0.D3, §0.D4 and §0.D5.

---

## 0. Decisions Answered Up Front

The three open questions in this plan — "backend or not", "how multiplatform", "what does Docker actually cover" — resolved first so the rest of the document can be concrete.

### D1 — Backend: **none in v1** (recommended)

| Option | Verdict | Why |
|---|---|---|
| No backend, device-local persistence | ✅ **Ship this for v1** | Every v1 feature is local state. An API adds auth, hosting, TLS, migrations, backups and a brand-new way for your drilling app to be *down* — in exchange for zero v1 features. |
| Containerised API + Postgres | ⏸️ **Optional, Phase 5** | Exactly two things justify it: cross-device sync, and the "hit a blank at work → drill it on the phone" loop. Both are `profile: sync` and off by default. |
| Never any backend | ⚠️ Honest limitation | AsyncStorage is **per-device**. A card added on the laptop does not exist on the phone, and reinstalling loses everything. |

**Belt-and-braces for v1 with zero infrastructure:** JSON export/import through the OS share sheet. That covers most of the sync need. A real API stays a *documented, disabled* Compose profile until it earns its place.

### D2 — One Expo app, not a monorepo
An `apps/*` + `packages/*` workspace costs real Metro resolver configuration and buys nothing while there is exactly one app and no backend. Single Expo app with a clear `src/` split. Promote to a workspace only when the Phase 5 service actually lands (YAGNI).

### D3 — Docker: for what it can do, honestly

| Target | Containerisable? | How |
|---|---|---|
| **Web app (production)** | ✅ **Yes, cleanly** | `expo export --platform web` → static files → nginx. Tiny image, no Node at runtime. |
| **Web dev server** | ✅ Yes, with caveats | Metro in a container + `REACT_NATIVE_PACKAGER_HOSTNAME`. See §3. |
| **Tests / CI gate** | ✅ Yes | Reproducible `tsc --noEmit` + `jest` + `expo export`. |
| **iOS binary** | ❌ **No. Impossible.** | Xcode is macOS-only and cannot be containerised. → EAS Build (cloud) or a local Mac. **Deferred in v1** (§0.D5). |
| **Android binary** | ✅ **Yes — on the host, not in the image** | `expo prebuild` + `./gradlew assembleRelease`, against the Android SDK already installed on this machine. No cloud build, no Expo account. See §0.D5. |
| **Android APK → the phone** | ✅ **Yes, outside Docker entirely** | The APK is just a file: `adb install` over USB, or upload to Google Drive and download it. No Play Store. |
| **Expo Go on a real phone** | ❌ Not usefully | Bridge networking breaks LAN discovery. `network_mode: host` (Linux) or a tunnel works, but this dev loop belongs on the host. |

> **Do not expect `docker compose up` to emit an `.ipa` or `.apk`.** Docker ships the **web** surface only. The Android APK is built on the **host** by Gradle (§0.D5); iOS is deferred until an Apple developer account exists.

### D4 — The cost, stated plainly
React Native for a *flashcard* app is heavier than a plain web app: only one of the three surfaces is dockerisable, and shipping iOS needs a paid Apple developer account. The Android cost is now much lower than first assumed — the Android SDK is already on this machine, so a release APK is one JDK install and one Gradle command away, with no cloud build and no Expo account (§0.D5). Multiplatform is still an explicit requirement and the codebase stays one, but **v1 ships two surfaces: web and Android**. **Revisit trigger:** if after a few weeks you only ever open the web build, the extra machinery is not paying for itself.

### D5 — Android delivery: build the APK here, install it yourself

Docker ships the web surface and nothing else, so the Android app is built **on the host** with the Android SDK already installed — no EAS, no Expo account, no Play Store.

| Step | Command | Output |
|---|---|---|
| Point at the SDK | `export ANDROID_HOME="$HOME/Android/Sdk"` | Gradle can find the SDK |
| Build | `npx expo prebuild -p android` then `./gradlew assembleRelease` | `android/app/build/outputs/apk/release/app-release.apk` |
| Install (USB) | `adb install -r <apk>` | App on the phone, no store involved |
| Install (Drive) | Upload the APK → download on the phone → tap to install | Same result, no cable |

Three consequences worth stating plainly:

1. **The release variant is what makes the APK standalone.** A debug build bundles no JavaScript and needs a reachable Metro server, so it is useless from Google Drive. Only the release APK is self-contained.
2. **Replacing a build usually keeps your cards; uninstalling does not.** Android keys an app to its signing key, so an `INSTALL_FAILED_UPDATE_INCOMPATIBLE` means the old copy must be removed first — which erases on-device storage. Export the deck to JSON before replacing a build you care about, which is exactly what §0.D1's export/import provides.
3. **Nothing in this path needs an Expo account.** `expo start`, `expo export` and `expo prebuild` are all local; only `eas` commands talk to Expo's cloud, and v1 runs none of them. Expo Go stays as the day-to-day dev loop because it also needs no account.

**iOS is deferred, not dropped.** An iPhone cannot be sideloaded from a file, so iOS needs a paid Apple developer account and, because Xcode is macOS-only, either EAS Build or a Mac. The codebase stays multiplatform so that path remains open later; the v1 *ship* targets are **web and Android**.

The full instruction, its JDK prerequisite and its troubleshooting table are in `BUILD.md`.

---

## 1. Tech Stack & Architecture

### Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Expo SDK (current stable)** + React Native + TypeScript | One codebase → iOS, Android, Web. |
| Routing | **expo-router** | File-based; real URLs on web, native back-button for free. |
| Styling | **NativeWind** (Tailwind syntax on RN + web) | Preserves the original Tailwind intent with one token set everywhere. |
| State | React state + `useReducer` for the deck, Context for the active session | No Redux/Zustand at this size. |
| Persistence | `@react-native-async-storage/async-storage` behind a `storage` adapter | localStorage on web, native KV on device. One call site to change. |
| Later upgrade | `expo-sqlite` / MMKV | Only if the deck outgrows one JSON document. |
| Testing | `jest-expo` + `@testing-library/react-native` | Pure logic in `lib/` is unit-tested with no device. |
| Containers | Docker + Compose (web prod, web dev, CI) | §3. |
| Native builds (Android) | **Local Gradle** — `npx expo prebuild -p android` + `./gradlew assembleRelease` | The Android SDK is already on this machine; yields a plain APK with no cloud build and no Expo account. §0.D5. |
| Native builds (iOS) | EAS Build — **deferred** (§0.D5) | Not sideloadable, so it cannot share the Android path. |
| Dev loop on device | `npx expo start` on the host + **Expo Go** | Hot reload with no build, no account and no cable. |

### Architecture

```
App (expo-router)
├── app/
│   ├── _layout.tsx            root shell: theme, storage hydration gate
│   ├── index.tsx              Session screen (Flip / Type modes)
│   ├── cards.tsx              Deck manager: list, filter, search
│   └── edit/[id].tsx          Card editor (new / edit custom card)
├── src/
│   ├── components/
│   │   ├── ModuleNav.tsx      Containers | JS/TS | PHP+Laravel | SQL | All
│   │   ├── FilterBar.tsx      All | New | Need Practice | Mastered
│   │   ├── FlipCard.tsx       flip animation; tap / swipe / key to reveal
│   │   ├── ActiveInput.tsx    monospace answer box, Check, diff feedback
│   │   ├── StatusButtons.tsx  Need Practice | Mastered
│   │   └── CardEditor.tsx     shared form, rendered by the route
│   ├── hooks/
│   │   ├── useDeck.ts         load / merge / persist, migrations
│   │   ├── useSession.ts      queue building, current index, scoring
│   │   └── useHotkeys.ts      + .web.ts / .native.ts platform split (see below)
│   ├── lib/
│   │   ├── storage.ts         AsyncStorage wrapper, versioned key, migrate()
│   │   ├── normalize.ts       answer comparison
│   │   ├── srs.ts             due-date scheduling
│   │   └── seedCards.ts       the 17 cards, stable ids
│   ├── types/card.ts
│   └── theme/
├── assets/
├── docker/                    web.Dockerfile, dev.Dockerfile, nginx.conf
├── docker-compose.yml
├── app.json
└── package.json
```

> **Platform-split hook (a real trap):** React Native has no `onKeyDown`. Keyboard shortcuts are a **web-only** affordance, so `useHotkeys` cannot be a single file — create `useHotkeys.web.ts` (attaches `window.addEventListener('keydown')`) and `useHotkeys.native.ts` (a no-op, or a hidden `TextInput` for iPad + hardware keyboard). Metro resolves the platform extension automatically; one "cross-platform-looking" file will silently do nothing on device.

### Data Model

```ts
export type ModuleId = 'containers' | 'js-ts' | 'php-laravel' | 'sql';
export type Status = 'new' | 'need-practice' | 'mastered';

export interface Card {
  id: string;              // seeds: 'seed-containers-1'; custom: crypto.randomUUID()
  module: ModuleId;
  front: string;           // prompt / question
  back: string;            // exact minimal syntax
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;      // tombstone — free now, essential the moment sync exists
}

/** Review state lives separately from card content. */
export interface ReviewState {
  status: Status;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: number;
  dueAt?: number;          // SM-2-lite scheduling
  intervalDays?: number;
  ease?: number;           // default 2.5
}

export interface PersistedState {
  schemaVersion: 1;        // bump + migrate() whenever the shape changes
  cards: Record<string, Card>;
  reviews: Record<string, ReviewState>;
}
```

Two design calls that are painful to retrofit, so they are in from day one:

1. **Content and progress are separate maps.** Re-seeding or fixing a card's wording never wipes your mastery on it.
2. **`schemaVersion` + `migrate()`.** With no server there is nobody to fix the shape later — and you *will* change this model.

**Storage key:** `syntax-gym/v1/state` — one document, written on change (debounced ~300 ms). Load merge: `cards` unioned with seeds (seed ids are stable), `reviews` always wins over seed defaults.

---

## 2. Platform Capability Matrix

| Capability | Web | iOS | Android |
|---|---|---|---|
| Flip by tap | ✅ | ✅ | ✅ |
| Flip by swipe / gesture | ⚠️ mouse drag | ✅ | ✅ |
| Space / ← → / j k shortcuts | ✅ | ⚠️ iPad + hardware keyboard only | ⚠️ physical keyboard only |
| Monospace code input | ✅ | ✅ | ✅ |
| Local persistence | AsyncStorage → localStorage | AsyncStorage → native KV | AsyncStorage → native KV |
| Install as an app | PWA manifest (Expo default) | Expo Go now; App Store later | **Sideloaded APK** — Drive download or USB |
| Build path | **Docker** (static export → nginx) | EAS Build or a local Mac — deferred | **Local Gradle on the host** → APK |
| Deep links | ✅ real URLs via expo-router | ✅ universal links | ✅ app links |

> Keyboard-first is a **desktop-web** feature. On phones the equivalent is gesture-first with large thumb targets. Design the session screen so **no interaction requires a keyboard** — then layer shortcuts on top for web.

---

## 3. Docker & Delivery

### What runs in containers

| Image | Purpose | Base | Output |
|---|---|---|---|
| `web` | Production web app | `nginx:alpine` (Node only in the build stage) | Static SPA on `:8080` |
| `web-dev` (profile `dev`) | Metro dev server | `node:22-bookworm-slim` | HMR on `:8081` |
| `ci` (profile `ci`) | Typecheck + tests + export gate | `node:22-bookworm-slim` | Exit code |
| `api` + `db` (profile `sync`) | **Phase 5 only** — cross-device sync | Node + `postgres:16-alpine` | Commented out until needed |

Nothing above produces an APK. See §3.1.

### 3.1 — The Android APK is built on the host, not in an image

| Tool | Where it runs | Why not Docker |
|---|---|---|
| `expo prebuild` + `gradlew assembleRelease` | The host shell | The Android SDK is already installed here. A JDK + Android SDK + Gradle image is multi-gigabyte and slow for no benefit (§0.D5). |
| `adb install` | The host shell | It needs the phone's USB bus, which a container does not see by default. |

The four commands, the JDK prerequisite and the failure modes are in **`BUILD.md`** — a short document on purpose, because the whole Android path is one build, one copy and one install.

### `docker/web.Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

# ---------- build ----------
# Debian/glibc base on purpose — see "Container network gotcha" below.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Deps first, so this layer caches across source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV EXPO_NO_TELEMETRY=1 NODE_ENV=production
# app.json: { "web": { "output": "single" } }  ->  static SPA in /app/dist
RUN npx expo export --platform web

# ---------- serve ----------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# exec-form: no `sh -c` wrapper, so SIGTERM reaches nginx directly and stops are instant.
CMD ["nginx", "-g", "daemon off;"]
```

### `docker/dev.Dockerfile`

```dockerfile
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV EXPO_NO_TELEMETRY=1 BROWSER=none CI=1
EXPOSE 8081
CMD ["npx", "expo", "start", "--port", "8081"]
```

### `docker/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Hashed bundles are immutable; the HTML shell must never be cached.
  # NOTE: confirm the exact folder names after the first `expo export`
  # (modern SDKs emit `_expo/static/...` plus `assets/`).
  location ~* ^/(_expo|assets)/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;   # SPA fallback for client-side routes
  }

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;
}
```

### `docker-compose.yml`

```yaml
services:
  web:
    build: { context: ., dockerfile: docker/web.Dockerfile }
    image: syntax-gym-web:local
    ports: ["8080:80"]
    restart: unless-stopped
    healthcheck:
      # 127.0.0.1, never `localhost`: busybox wget resolves localhost -> ::1 first,
      # nginx listens on IPv4 only, and the check then fails forever.
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:80/"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 5s
    read_only: true        # verify on first run; drop if nginx needs another writable path
    tmpfs: ["/var/cache/nginx", "/var/run"]

  # Dev server:  docker compose --profile dev up web-dev
  web-dev:
    profiles: ["dev"]
    build: { context: ., dockerfile: docker/dev.Dockerfile }
    ports: ["8081:8081"]
    environment:
      - EXPO_NO_TELEMETRY=1
      - BROWSER=none
      # Metro advertises bundle URLs using this host. Unset inside a container it
      # advertises the container IP and the host browser cannot load the bundle.
      - REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:?set HOST_IP to your LAN IP}
    volumes:
      - .:/app
      - /app/node_modules
    init: true

  # One-shot gate: typecheck + tests + web export must all pass.
  ci:
    profiles: ["ci"]
    build: { context: ., dockerfile: docker/web.Dockerfile, target: build }
    command: ["npm", "run", "verify"]

  # ---- Phase 5 only: cross-device sync. Off unless explicitly requested. ----
  # api:
  #   profiles: ["sync"]
  #   build: { context: ./services/api }
  #   ports: ["3000:3000"]
  #   environment: ["DATABASE_URL=postgres://gym:gym@db:5432/gym"]
  #   depends_on: { db: { condition: service_healthy } }
  # db:
  #   profiles: ["sync"]
  #   image: postgres:16-alpine
  #   environment: ["POSTGRES_USER=gym", "POSTGRES_PASSWORD=gym", "POSTGRES_DB=gym"]
  #   volumes: ["pgdata:/var/lib/postgresql/data"]
  #   healthcheck:
  #     test: ["CMD-SHELL", "pg_isready -U gym"]
  #     interval: 5s
  # volumes: { pgdata: }
```
`package.json` gains one script so the CI image has a single exec-form entry point:
```json
"verify": "tsc --noEmit && jest --ci && expo export --platform web"
```

### Container network gotcha (verified on this machine)

Containers here have **no IPv6 route** while DNS still returns AAAA records first, so `npm ci` can stall ~10 s per request and time out — while the host reaches the same registry in milliseconds. Two consequences:

1. Keep the build stage on a **Debian/glibc** base (`node:22-bookworm-slim`). If a build still stalls on network, add:
   ```dockerfile
   RUN printf 'precedence ::ffff:0:0/96  100\n' >> /etc/gai.conf
   ```
   That file is glibc-specific — it does nothing on musl/Alpine.
2. The runtime stage (nginx) makes no outbound calls, so it is unaffected.

Diagnose before chasing: the signature is a container stalling ~10 s per fetch while the same host resolves instantly. Test the same hostname from both sides.

### Three dev loops (use the cheapest one)

| Loop | Command | Use it for |
|---|---|---|
| **Native, fast** | `npx expo start` **on the host**, scan the QR with Expo Go | ~95 % of iteration — hot reload on a real phone. Do **not** containerise this one. |
| **Containerised web** | `HOST_IP=$(hostname -I \| awk '{print $1}') docker compose --profile dev up web-dev` | Verifying in the same base image you will deploy. |
| **Release check** | `docker compose up --build` then open `:8080` | Final gate before shipping the web surface. |
| **Android APK** | `npx expo prebuild -p android && cd android && ./gradlew assembleRelease` | Producing the file you actually install. Minutes, not seconds — use the native loop above while iterating, and this only when a build is worth shipping. |

> If you insist on running Metro in a container for device testing on Linux, use `network_mode: host` — bridge networking cannot see the phone's LAN broadcast.

---

## 4. Core Features (Priority Order)

### Phase 1 — MVP (flip + persist)
1. **Flip card mechanics** — front: natural-language prompt; back: exact minimal syntax. Tap, swipe, or (web) Space to flip.
2. **Module structure** — the four fixed modules plus "All"; navigation via `ModuleNav` (tabs on phone, sidebar on wide web).
3. **Persistence** — seed the 17 cards on first run, `storage.ts` adapter, migrate-on-load, add custom cards, survive reload on Web and Android.
4. **Status & filtering** — per-card Need Practice / Mastered; filter All | New | Need Practice | Mastered; counter "X left in Need Practice".

### Phase 2 — Active typing mode
5. **Type Mode** — toggle Flip ↔ Type. Show the front only; monospace `TextInput`; Check on Enter (web) or via button (all platforms); compare through `normalize.ts`; show correct / incorrect plus the expected answer; offer a status update after checking.
   - Input hygiene: `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}`, and monospace via `Platform.select({ ios: 'Menlo', android: 'monospace', web: 'ui-monospace, monospace' })`.
   - Normalisation: trim, collapse runs of whitespace, ignore trailing newlines. **Indentation-insensitive but otherwise exact** — this is a syntax trainer, so never fuzzy-match punctuation.

### Phase 3 — Polish & UX
6. **Spaced repetition lite** — `dueAt = now + intervalDays`; correct → interval grows (×ease); incorrect → reset to 1 day and flag Need Practice. Session queue = due first, then Need Practice, then New.
7. **Card management** — edit/delete custom cards (soft delete via `deletedAt`); export/import the whole deck as JSON via the OS share sheet.
8. **Keyboard-first on web** — `useHotkeys.web.ts`: `Space` flip, `←/→` navigate, `1` Need Practice, `2` Mastered, `e` edit, `n` new. Visible focus rings. On native the equivalent is gesture + always-reachable buttons.

---

## 5. Dataset – Exact Concepts to Seed

### Module 1: Containers & Symbols (The Punctuation Rules)
| Front (Prompt) | Back (Syntax) |
|----------------|---------------|
| Container for actions, parameters, conditions, and execution flow | `( )` |
| Container exclusively for sequential lists and arrays | `[ ]` |
| Container for key-value data structures (Objects) and code blocks / scopes | `{ }` |
| Compact modern wrapper for inline functions | `=>` |

### Module 2: JavaScript & TypeScript Core Operations
| Front (Prompt) | Back (Syntax) |
|----------------|---------------|
| Declare a block-scoped variable that should not be reassigned | `const name = value;` |
| Access an object property dynamically using a variable key | `obj[key]` |
| Shrink an array to only items that match a boolean condition | `array.filter(item => condition)` |
| Transform every item in an array into a new structure | `array.map(item => transformation)` |
| Write a concise inline if/else decision | `condition ? trueValue : falseValue` |

### Module 3: PHP & Laravel Syntax Essentials
| Front (Prompt) | Back (Syntax) |
|----------------|---------------|
| Declare a PHP variable (strict prefix rule) | `$variableName` |
| Write a modern PHP arrow closure | `fn($n) => ...` |
| Safely fall back to a default when a value is null or undefined | `$value ?? $default` |
| Chain Laravel Collection methods to filter and extract attributes | `Collection->where(...)->pluck(...)` |

### Module 4: SQL & Database Query Structures
| Front (Prompt) | Back (Syntax) |
|----------------|---------------|
| Select specific columns from a table with a condition | `SELECT col1, col2 FROM table WHERE condition;` |
| Join two related tables using a foreign key | `JOIN other_table ON table.fk = other_table.id` |
| Insert a new record into a table | `INSERT INTO table (col1, col2) VALUES (val1, val2);` |
| Create an index on a lookup column for performance | `CREATE INDEX idx_name ON table (column);` |

> **Note**: Seed these 17 cards exactly as shown (4 + 5 + 4 + 4). Users can later add their own cards for any language or pattern they struggle with.

> **Content footnote**: in PHP, `??` is the **null**-coalescing operator — PHP has no `undefined`, and `??` also fires on unset variables. Worth knowing before an interviewer picks at it; the seed card's wording is JavaScript phrasing.

---

## 6. Implementation Roadmap

### Step 1 — Scaffold (2 surfaces from minute one)
- `npx create-expo-app@latest . --template default` (TypeScript + expo-router)
- Add NativeWind; verify it renders on **web and a device** before building features
- Add `docker/web.Dockerfile`, `docker/nginx.conf` and `docker-compose.yml` **now** — an app that has never been exported to web discovers its web problems far too late
- Confirm `app.json` has `"web": { "output": "single" }` and that `docker compose up --build` serves a placeholder page

### Step 2 — Data layer
- `types/card.ts` (content and `ReviewState` split)
- `lib/seedCards.ts` — the 17 cards with stable ids
- `lib/storage.ts` — `schemaVersion`, `migrate()`, debounced write
- `lib/normalize.ts` + unit tests (no device required, runs in the CI image)

### Step 3 — Core UI
- `ModuleNav`, `FilterBar`, `FlipCard`, `StatusButtons`
- Session screen wiring; loading and empty states for a hydrated-but-empty deck

### Step 4 — Active input mode
- `ActiveInput` + comparison + feedback UI, reusing `normalize.ts`

### Step 5 — Card editor
- Add / edit / delete custom cards; validate non-empty front and back
- Export / import JSON round-trip

### Step 6 — Polish & ship
- Adaptive layout across phone, tablet and desktop-web widths
- Dark mode **by default** (it is a coding tool)
- Accessibility: `accessibilityLabel` on every control, sane focus order, ≥44 pt targets
- `useHotkeys.web.ts` + visible focus rings
- First **release APK** built on the host and installed on a real phone by sideload — both the USB and the Google Drive routes exercised (§0.D5, `BUILD.md`)

### Step 7 — Verifiable gates
Run these; do not assume them.

- `docker compose --profile ci run --rm ci` → typecheck, tests and export all pass
- `docker compose up --build` → `:8080` loads; flip works; a new custom card survives reload
- `npx expo start` on the host → the same card appears on a phone through Expo Go
- `./gradlew assembleRelease` → an APK exists at `android/app/build/outputs/apk/release/app-release.apk`
- `adb install -r <apk>` with Metro stopped → the app runs standalone, not only against a dev server
- A Drive download of the same APK installs on the phone with no cable attached
- Lighthouse against the container → sane performance and accessibility scores

---

## 7. Definition of Done (v1)

- [ ] Four modules seeded with the exact 17 concepts
- [ ] **One codebase** runs on Web + Android (`expo start` on the host for iteration; a sideloaded release APK on a real phone for the shipped app). iOS is deferred pending an Apple developer account (§0.D5) — the code stays multiplatform, but the v1 ship target is two surfaces
- [ ] Flip card works by touch, gesture, and (web) keyboard
- [ ] Active typing mode with correct/incorrect feedback and exact-syntax comparison
- [ ] Status buttons + filtering by status
- [ ] Custom cards can be added, edited, deleted and persist across reloads on Web and Android
- [ ] The release APK installs and runs on a phone with **no dev server running**
- [ ] `docker compose up` serves the production web build; `--profile ci` passes
- [ ] JSON export/import round-trips losslessly
- [ ] **No backend required and no runtime network call**
- [ ] Keyboard-friendly on desktop web, gesture-friendly on mobile

---

## 8. Success Metrics (for personal use)

- Can open the app and immediately start drilling weak syntax
- Adding a new card after a real coding blank takes **< 15 seconds** on any device
- After 2–3 weeks of daily 10-minute sessions, the "Need Practice" list shrinks noticeably
- Typing mode feels harder (and therefore more valuable) than pure flip mode
- The phone build gets used — if it does not, the React Native decision needs revisiting (§0.D4)

---

## 9. Interaction Design & Accessibility

- **Focus management** — Type Mode autofocuses its input; the session screen keeps one clear primary action.
- **States** — loading (storage hydrate), empty deck, empty filter result, and incorrect-answer feedback all get designed, not just defaulted.
- **Labels** — every icon button gets `accessibilityLabel`; the flip card announces whether it is showing front or back.
- **Motion** — respect `prefers-reduced-motion` on web and the OS reduce-motion setting on native; the flip animation degrades to an instant swap.
- **Performance** — the deck is ~17 cards; keep it a single in-memory document, avoid per-card subscriptions, and never block first paint on the storage read.

---

## 10. Future Extensions (Out of Scope for v1)

- **Sync service** (the one thing that would justify a backend) — dockerised, behind `profile: sync`
- Real spaced repetition (SM-2 or FSRS) replacing the lite scheduler
- Syntax highlighting in the answer / input box (`react-native-syntax-highlighter`, or Shiki on web)
- Progress charts / streak tracking
- PWA service worker for true offline web install
- Play Store submission — needs a real upload keystore, since the sideloaded APK is signed with the debug key
- App Store submission — needs the paid Apple developer account that defers iOS in v1 (§0.D5)
- Shareable public decks

---

This plan is ready to be turned into executable tasks.