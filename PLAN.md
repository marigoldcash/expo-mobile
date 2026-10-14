# The phone wallet: the plan from PH-M4 on

This is the step list of the Marigold phone wallet from PH-M4 to the stores. It was copied here on 2026-10-14 from `docs/marigold/MOBILE-PLAN.md` in `marigoldcash/marigold`, where PH-M0 to PH-M3 are done and recorded (the Rust core, its interface, the bindings and the release assets). From now on this copy is the plan and the session that owns this repository amends it.

How to work it, as in the original: one step at a time, in order; a step is ticked only when its verify passes; the commit message starts with the step ID (`PH-M4a: …`); work in a clone of your own and a branch per step; push and fast-forward `main` in the same session; nothing in this repository installs or runs a Rust toolchain. A path written `mobile/` in a later step means the root of this repository. The core's release assets come from `marigoldcash/marigold` (workflow `mobile-core.yaml`, attached to the `marigold` release of a tag as `marigold-core-<version>-ios.zip`, `marigold-core-<version>-android.zip` and `SHA256SUMS-core.txt`); until a tag carries them, the same zips are the `marigold-core-ios` and `marigold-core-android` artifacts of a `Mobile core` run on a `mobile/` branch of that repository, and `MARIGOLD_CORE_DIR` (PH-M4b) points the fetch at them.

What the core offers (PH-M3a): one `MarigoldCore` object over a wallets folder the app names, with `list_wallets`, `create_wallet`, `restore_from_words`, `restore_telegram`, `open`, `close`, `balance`, `status`, `history`, `receive`, `request`, `wait_request`, `pay_preview`, `pay`, `share_key`, `give`, `recovery_words`, `change_password`, `backup_status`, `backup_now`, `backup_automatic`, `backup_decline`, `backup_cover`, `telegram_setup`, `light_status`, `probe`, `set_listener`; the `EventListener` callback interface (`on_say`, `on_notes_changed`, `on_connection`); the `WalletError` enum (`NoWalletOpen`, `Network`, `Failed`, each with the words to show); `core_version()`. In Swift the module is `MarigoldCore` (C module `MarigoldCoreFFI`); in Kotlin the package is `cash.marigold.core`, and the library is `libkaspa_wallet_service.so`. The Android libraries are built for `arm64-v8a` and `x86_64` only, so the app limits `reactNativeArchitectures` to those two.

### PH-M4 — The Expo app and the native module, in expo-mobile

From PH-M4 on the work is in `marigoldcash/expo-mobile`, one Expo project for Android and iOS, in a clone of your own of that repository, not in this one. When PH-M4 is reached, copy PH-M4 and everything after it (PH-M5 to PH-M12) into that repository as its `PLAN.md`; from then on that copy is the plan and the session that owns it amends it, and this file keeps only a pointer. A path written `mobile/` in a later step means the root of that repository, and the release workflow of PH-M10 lives there. No step in that repository installs or runs a Rust toolchain.

Do: an Expo app (TypeScript, Expo SDK current, development client, EAS config checked in without credentials) and a local Expo module `modules/marigold-core` whose Swift and Kotlin sides wrap the UniFFI bindings that the core's release assets carry (PH-M3d) and whose TypeScript side exposes them as typed functions and an event emitter. The first screen shows the core's version.

- [ ] **PH-M4a — The app skeleton.** The Expo app, TypeScript strict, the development client configuration, Jest, Maestro, and `npm test` passing on an empty wrapper. Verify: `npm test`; `npx expo doctor` clean.
- [ ] **PH-M4b — The core, fetched by version and checksum.** One file, `marigold-core.json`, names the `marigold` release tag and, for each of the two assets of PH-M3d, its download URL (under `github.com/marigoldcash/marigold/releases/download/<tag>/`) and SHA-256. `scripts/fetch-core.mjs` reads it, downloads the two zips, verifies each checksum before unpacking, and unpacks the XCFramework and bindings for iOS and the `jniLibs` and bindings for Android into the native module's folders (not checked in). The environment variable `MARIGOLD_CORE_DIR` points the script at a local marigold build's output (the same two zips, or their unpacked folders) instead of downloading, for working on the core and the app together. Verify: a Jest test of the script against a local fixture covers the happy path, a wrong checksum (refused, nothing unpacked), a missing asset, and the local override; against the real release candidate of PH-M3d the fetch succeeds and unpacks both. The script never invokes `cargo`, `rustc` or `rustup`, and a test greps for it.
- [ ] **PH-M4c — The native module, iOS.** The Expo module's Swift side wraps the generated binding; the podspec pulls the XCFramework the fetch unpacked; the first screen shows `version()`. Verify: a development client builds for the iOS simulator on the macOS runner and a Maestro flow reads the version on screen.
- [ ] **PH-M4d — The native module, Android.** The Kotlin side wraps the generated binding; the module pulls the `jniLibs`. Verify: the same on an Android emulator on the Ubuntu runner.
- [ ] **PH-M4e — The TypeScript wrapper.** Typed functions for every exported operation and an event emitter for the callback interface; Jest tests against a mocked native module. Verify: `npm test` covers every function once.

Done when: both simulator builds show the version from Rust, and neither build job installed a Rust toolchain.

### [ ] PH-M5 — Storage, the password and biometrics

Do: the wallet folder is the app's own documents directory (iOS: excluded from iCloud backup by attribute, since the sealed backup of PH-M8 is the backup; Android: internal storage); files owner-only as on the desktop. The password is the PIN the policy already requires (at least four characters); it is kept in the Keychain / Keystore (`expo-secure-store`) and released by `expo-local-authentication` (Face ID, fingerprint), with the PIN typed as the fallback. The password never crosses to JavaScript in the clear longer than the call that opens the wallet.

Verify: Maestro: create a wallet, kill the app, reopen with biometrics (simulator-enrolled), the balance screen appears; a Rust test asserts the created files' modes; a wrong PIN shows "That is not this wallet's password." Done when: the flow passes on both platforms.

### PH-M6 — Connect, and the light copy

Do: on open, the app connects to the public computer (default `wss://rpc1.marigold.cash` for testnet-10, changeable in settings; a `ws://` address for one's own node) and the service starts the light copy as the desktop does; the `say` lines ("Connecting…", "Taking your own copy of the notes…") show on the open screen. On foreground after background the service reconnects and restarts from the latest anchor; on network loss the status says so in plain words. No background execution is requested; the app says incoming payments show when it is open.

- [ ] **PH-M6a — Connect and the light copy.** Verify: Maestro against testnet: open, the status reads "a public computer, with your own copy of the notes" within thirty seconds, on both platforms.
- [ ] **PH-M6b — Background and back.** Verify: background the app ten minutes (simulator clock), foreground, the status is current within thirty seconds; airplane mode gives the plain-words message and recovery when it ends, on both platforms.

Done when: both pass.

### PH-M7 — The screens, basic

Do: seven screens, plain components, no styling pass: Open or create (list of wallets, create with the words shown once and two asked back as the terminal does, restore from words); Home (balance in notes and ledger, the last movements, connection status line); Receive (a request code with amount, as text and QR); Pay (paste or scan a code, preview with amount and fee, confirm, result); History; Backup (status, back up now, the words again behind biometrics); Settings (node address, PIN change, advanced switch). Every text from the service, not retyped.

One screen per sub-step, each with its own Maestro flow, in this order because each needs the one before:

- [ ] **PH-M7a — Open or create.** List, create with the words shown once and two asked back, open with the PIN. Verify: create, close, open; the balance screen appears.
- [ ] **PH-M7b — Home.** Balance in notes and ledger, the connection status line, the last movements. Verify: the faucet's figures match the terminal's `balance` for the same wallet file.
- [ ] **PH-M7c — Receive.** A request code with an amount, as text and QR. Verify: a faucet payment to the request lands and shows on Home.
- [ ] **PH-M7d — Pay.** Paste a code, preview with amount and fee, confirm, result. Verify: a payment to a terminal wallet's request goes out and the terminal receives it.
- [ ] **PH-M7e — History.** Verify: both movements above show, with the terminal's wording.
- [ ] **PH-M7f — Backup.** Status, back up now, the words again behind biometrics. Verify: the words shown equal the ones from creation.
- [ ] **PH-M7g — Settings and restore.** Node address, PIN change, the advanced switch; restore from words on the open screen. Verify: restore from words on a fresh install brings the ledger back; the PIN change is refused with the wrong current PIN.

Done when: all seven pass on both platforms.

### [ ] PH-M8 — Backups to the cloud

Do: the sealed backup bundle (the folder backup of `backup.rs`, sealed to the 24 words) written on a schedule to the app's iCloud Drive container on iOS and to Google Drive's app folder on Android, and read back on restore: restore asks for the words, finds the bundle, brings the notes back. The toggle is on by default and explained in one sentence.

Verify: Maestro: wallet with notes, backup runs, app deleted and reinstalled, restore from words plus the cloud bundle, notes back; a Rust test covers the bundle round trip through the service. Done when: the round trip passes on both platforms with real iCloud and Drive test accounts.

### [ ] PH-M9 — Camera and sharing

Do: scan a payment or request code with the camera (`expo-camera`), paste from the clipboard, share a request code through the system share sheet, and open `marigoldpay:` / `marigoldreq:` links handed to the app.

Verify: Maestro with a code rendered on screen and scanned from a second device or an injected image; a link opened from a message opens the pay screen prefilled. Done when: both pass.

### [ ] PH-M10 — Release builds and testers

Do: `mobile-release.yaml`: signed builds through EAS Build or the runners, with the certificates and keys in the organisation's accounts and workflow secrets; upload to TestFlight and the Play internal track on a tag `mobile-vX`; the testers' group invited; version number from the workspace version.

Verify: a tester installs from TestFlight and from the Play internal track and completes the PH-M7 flows. Done when: both tracks carry a build the testers use.

### [ ] PH-M11 — Words and reach

Do: the grandma-safe pass over every string, screen reader labels, large text, dark mode following the system; the terminal's exact phrasings reused where the same thing is said.

Verify: a checklist in the pull request; two testers from the group who are not developers complete the four flows unaided. Done when: they do.

### [ ] PH-M11b — Knowing when a payment arrived while the app was closed (after PH-M7, before the stores)

Do, in this order, each its own pull request. (1) A background check: the app asks the operating system for periodic background time (iOS background app refresh, Android WorkManager), takes the light copy's diffs since its last look, checks its own request keys and its ledger address locally, and raises a local notification "A payment arrived. Open the wallet." Nothing leaves the phone; the delay is the operating system's, fifteen minutes to hours. (2) A payer-side ping, opt in: a request code may carry a one-time notify token minted by a small relay we run; a paying wallet that honours it tells the relay "token done" once its transaction is accepted, and the relay pushes the same content-free line to the device behind the token. The relay learns that a device received a payment at a time, never which note or how much; tokens are single use; the wallet trusts nothing in the push and reads its own copy on open. (3) For people with a home machine, the wallet service there, which watches anyway, pings through the same relay. Never (4): registering keys with a public node to be watched.

Verify: (1) on a simulator with background refresh forced, a faucet payment to a request issued before the app was closed raises the local notification within the next refresh; (2) a terminal wallet paying a request with a token produces a push on the device within seconds, and the relay's log holds no key, serial or amount; (3) the Telegram-linked machine's payment produces the push. Done when: the three pass and the FAQ says what the relay learns.

### [ ] PH-M12 — The stores

Do: App Store listing and review (privacy manifest, the non-custodial wallet declaration, screenshots), Play listing (data safety form, financial-services declaration), a page on marigold.cash for the app, the FAQ entry, and the release post.

Verify: both apps live, installable from the stores. Done when: the links are on the website.

## Out of scope, on purpose

A public node watching your request keys to notify you (it would learn which keys are yours, the thing the light wallet exists to avoid); mining on the phone (forbidden by Apple, pointless anyway), the Telegram bot's features (the bot stays as the remote for a home machine), assets and lanes (not active on any network), and any visual design beyond the basic components until the structure stands.
