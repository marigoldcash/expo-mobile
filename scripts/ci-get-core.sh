#!/usr/bin/env bash
#
# The core for a CI job: the release pinned in marigold-core.json when there is one, and until the first release that
# carries the core, the zips of the latest successful `Mobile core` run on a branch of marigoldcash/marigold
# (CORE_BRANCH, default mobile/PH-M3c), which are the same two files a release will carry.
set -euo pipefail

cd "$(dirname "$0")/.."
if [ -n "$(node -p "require('./marigold-core.json').tag")" ]; then
  node scripts/fetch-core.js
  exit 0
fi

BRANCH="${CORE_BRANCH:-mobile/PH-M3c}"
RUN=$(gh run list --repo marigoldcash/marigold --workflow mobile-core.yaml --branch "$BRANCH" --status success --limit 1 --json databaseId -q '.[0].databaseId')
[ -n "$RUN" ] || { echo "no successful Mobile core run on $BRANCH" >&2; exit 1; }
echo "the core from run $RUN on $BRANCH"
rm -rf core-download core-zips
mkdir core-zips
gh run download "$RUN" --repo marigoldcash/marigold -n marigold-core-ios -n marigold-core-android -D core-download
cp core-download/*/*.zip core-zips/ 2>/dev/null || cp core-download/*.zip core-zips/
MARIGOLD_CORE_DIR="$PWD/core-zips" node scripts/fetch-core.js
