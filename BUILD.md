# Building the Android APK

How the Android app gets made and onto your phone: build an **APK file** on this machine with
Gradle, then install it — over USB with `adb`, or by putting the file on Google Drive and
downloading it on the phone.

No Expo account. No cloud build. No Play Store.

- **Web** is a separate path: `docker compose up --build`, served at `:8080` (see `README.md`).
- **iOS** is deferred — an iPhone cannot be sideloaded from a file, so it needs a paid Apple
  developer account plus EAS Build or a Mac. Nothing here covers iOS.

---

## What is already on this machine

Checked 2026-09-28:

| Thing | Status |
|---|---|
| Android SDK at `~/Android/Sdk` | ✅ present, 4.5 GB — build-tools `36.0.0` / `36.1.0` / `37.0.0`, platforms `android-34` / `35` / `36` / `36.1`, `platform-tools/adb`, `cmdline-tools/latest`, NDK, cmake |
| SDK licences accepted (`~/Android/Sdk/licenses/`) | ✅ present — usually the fiddly part |
| Free disk on `/` | ✅ 160 GB |
| **A JDK** | ❌ **missing** — no `java` on `PATH`, nothing in `/usr/lib/jvm`, no Android Studio bundle |
| `ANDROID_HOME` | ❌ unset |

So the SDK is done and only the JDK is missing. Steps 1 and 2 fix that.

---

## Step 1 — Install a JDK

Gradle needs a **JDK**, not a JRE — it compiles Java/Kotlin, and a JRE has no `javac`. This needs
`sudo`, so run it yourself:

```bash
sudo apt install openjdk-17-jdk-headless
```

Confirm:

```bash
java -version     # expect openjdk 17.x
```

## Step 2 — Point the tools at the SDK

Add both lines to `~/.bashrc` so every shell has them:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

Reload, then check:

```bash
source ~/.bashrc
echo "$ANDROID_HOME"   # /home/adminpaws/Android/Sdk
adb version            # must work — the USB route in Step 4a needs it
```

## Step 3 — Build the release APK

From the project root:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
cd ..
```

`prebuild` generates the `android/` directory; `assembleRelease` compiles it. The first run
downloads Gradle and dependencies — expect several minutes. Do not interrupt it. Later builds are
far quicker.

The APK lands at:

```
android/app/build/outputs/apk/release/app-release.apk
```

Check it exists, and that the JavaScript is genuinely bundled inside it:

```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep index.android.bundle
```

> **The release variant is not optional.** A plain `npx expo run:android` produces a **debug** APK
> that contains no bundled JavaScript — it expects a Metro dev server to be reachable and shows a red
> error screen when there is not one. Only the **release** APK is standalone, and only it is safe to
> put on Google Drive.

> Prefer one command? With a phone or emulator already attached,
> `npx expo run:android --variant release` builds *and* installs. It cannot run without a target
> device, which is why the `prebuild` + `gradlew` pair above is the primary path — it needs no
> device at all, so you can build first and decide how to deliver afterwards.

## Step 4a — Install over USB

1. On the phone: **Settings → About phone → tap Build number seven times** to unlock Developer options.
2. **Settings → Developer options → enable USB debugging.**
3. Connect by USB and accept the RSA prompt on the phone.
4. Then:

```bash
adb devices        # the phone must appear as `device`, not `unauthorized`
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`-r` reinstalls over an existing copy, so this is also how you ship a later build.

## Step 4b — Install through Google Drive

1. Upload `app-release.apk` to Google Drive.
2. On the phone, open it in the **Drive app** and download it.
3. Open the downloaded file. Android asks whether to allow installs from this source — allow it for
   Drive, then install.

Two things worth knowing:

- Chrome and Files often refuse to open an APK from Drive. Download it **with the Drive app**
  rather than through a browser.
- Reinstalling a new build over an existing install normally keeps your data. If Android refuses
  with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the old app must be uninstalled first — **which erases
  its stored cards**. Export the deck to JSON before replacing a build you care about.

---

## Signing, and why this works with no keystore

Expo's prebuild template signs release builds with the **debug keystore** at
`~/.android/debug.keystore`. That is fine for sideloading your own app, and because that keystore is
machine-local and stable, every build from **this** machine shares a signing key — so
`adb install -r` and Drive reinstalls lay cleanly over each other.

Two consequences:

- Build the APK on a **different** machine and it gets a different key, so installing over this
  one's build fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
- The Play Store needs a real upload keystore. And because Android identifies an app by its signing
  key, switching keys later means the new APK cannot install over the old one. That is a Play Store
  problem, not a today problem.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `ERROR: JAVA_HOME is not set` / `Could not find tools.jar` | Step 1 skipped, or a JRE was installed instead of a JDK. Install `openjdk-17-jdk-headless`. |
| `SDK location not found` | `ANDROID_HOME` is unset in *this* shell. Re-run Step 2, then `source ~/.bashrc`. |
| `adb: command not found` | `platform-tools` is not on `PATH` — Step 2. |
| `adb devices` shows `unauthorized` | Accept the RSA prompt on the phone, then re-run. |
| App installs but shows a red error screen about a dev server | A **debug** APK was installed. Rebuild with `assembleRelease`. |
| Gradle download stalls or times out | Re-run it. The first dependency download is the slow one. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Different signing key than the installed copy. Uninstall first — this wipes stored cards, so export the deck to JSON beforehand. |
| Build succeeds but the APK is a few KB | JavaScript was not bundled — a debug variant slipped through. Check the `index.android.bundle` entry from Step 3. |

## What is verified, and what is not

- ✅ **Verified 2026-09-28:** the Android SDK and its contents, the accepted licences, and free disk
  space — the table at the top of this file.
- ❌ **Not yet verified:** the JDK install, the Gradle build, and both install routes. They cannot
  run until Step 1 is done, and Step 1 needs `sudo`.

Treat Steps 1–4 as **untested instructions** until a first APK actually installs on the phone. That
first successful run is what turns this document from a plan into a procedure — and until it has
happened, expect to correct a path or a flag here.
