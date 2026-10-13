# Working in this repository

This is the Marigold phone wallet: one Expo project (React Native, TypeScript) for Android and iOS, over the Rust wallet core that lives in `marigoldcash/marigold` under `wallet/service`. No Rust is built here: the native core arrives as a release asset of `marigold` (an XCFramework and the Android libraries, with their generated bindings), pinned by version and checksum in one file in this repository.

`PLAN.md` here is the step list from M4 onward of `docs/marigold/MOBILE-PLAN.md` in `marigold`, copied in by the session that starts M4 and kept here from then on; M1 to M3 are done in `marigold` on `mobile/*` branches. Until `PLAN.md` exists, read that file in `marigold` first. The repository map and the one-checkout-per-session rule are in `docs/marigold/REPOS.md` there: one session per checkout, `git status -sb` before the first commit, steps ticked only when their verify passes.

Commits are authored as `Dom <leancode@users.noreply.github.com>` with the step ID first in the message and no AI attribution anywhere. Everything a person can read in the app is written for someone's grandmother: the smallest unit is the petal, the money bucket is a wallet, errors say what happened and what to do. Secrets (signing keys, store credentials, the updater key) never enter the repository.

Two skills under `.claude/skills` apply to every Markdown edit and every commit message here; read them before the first of each.
