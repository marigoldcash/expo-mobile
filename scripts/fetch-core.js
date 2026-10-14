#!/usr/bin/env node
// Brings the Rust wallet core into the native module, as a download or from a local build.
//
//   node scripts/fetch-core.js
//
// marigold-core.json names the `marigold` release of the core and, for each of its two assets, the address and the
// SHA-256 the download must have. Each zip is checked against its checksum before anything is unpacked; if either
// does not match, or an asset is missing or is not what it should be, nothing is written. MARIGOLD_CORE_DIR points
// the script at a local build of the core instead: a folder holding the two zips (marigold-core-<version>-ios.zip and
// marigold-core-<version>-android.zip, as the `Mobile core` workflow of the marigold repository makes them), or the
// folders `ios` and `android` they unpack to. This script never builds anything: no Rust is compiled in this repository.
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { unzipSync } = require('fflate');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join('modules', 'marigold-core');

/** What each platform's zip must hold, and where it goes inside the native module. */
const LAYOUT = {
  ios: [
    { from: 'MarigoldCore.xcframework/', to: path.join(MODULE, 'ios', 'Frameworks', 'MarigoldCore.xcframework') },
    { from: 'swift/MarigoldCore.swift', to: path.join(MODULE, 'ios', 'Generated', 'MarigoldCore.swift') },
  ],
  android: [
    { from: 'jniLibs/', to: path.join(MODULE, 'android', 'src', 'main', 'jniLibs') },
    { from: 'kotlin/', to: path.join(MODULE, 'android', 'src', 'main', 'generated') },
  ],
};
/** One file of each kind that must be there, or the zip is not the core. */
const MUST_HAVE = {
  ios: [/^MarigoldCore\.xcframework\/Info\.plist$/, /^MarigoldCore\.xcframework\/ios-arm64\/.+\.a$/, /^swift\/MarigoldCore\.swift$/],
  android: [/^jniLibs\/arm64-v8a\/.+\.so$/, /^jniLibs\/x86_64\/.+\.so$/, /^kotlin\/.+\.kt$/],
};

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/** The files of a zip, by name; directories are left out. */
function entriesOf(bytes, what) {
  let files;
  try {
    files = unzipSync(bytes);
  } catch (err) {
    throw new Error(`${what} is not a zip file (${err.message})`);
  }
  return Object.fromEntries(Object.entries(files).filter(([name]) => !name.endsWith('/')));
}

function check(platform, files, what) {
  for (const pattern of MUST_HAVE[platform]) {
    if (!Object.keys(files).some((name) => pattern.test(name))) {
      throw new Error(`${what} does not hold what the core's ${platform} asset holds (nothing matches ${pattern})`);
    }
  }
}

/** A folder the zip unpacks to, read as the same name-to-bytes map. */
function entriesOfFolder(dir) {
  const files = {};
  const walk = (current) => {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, item.name);
      if (item.isDirectory()) walk(full);
      else files[path.relative(dir, full).split(path.sep).join('/')] = fs.readFileSync(full);
    }
  };
  walk(dir);
  return files;
}

async function pinned(config, platform, download) {
  const asset = config.assets && config.assets[platform];
  if (!config.tag || !asset || !asset.url || !asset.sha256) {
    throw new Error(
      'marigold-core.json names no release of the core yet. Set MARIGOLD_CORE_DIR to a local build of the core, or pin a release in that file.',
    );
  }
  let bytes;
  try {
    bytes = await download(asset.url);
  } catch (err) {
    throw new Error(`the ${platform} asset could not be downloaded from ${asset.url} (${err.message})`);
  }
  const got = sha256(bytes);
  if (got !== asset.sha256.toLowerCase()) {
    throw new Error(`the ${platform} asset from ${asset.url} has the wrong checksum (wanted ${asset.sha256}, got ${got}); nothing was unpacked`);
  }
  return entriesOf(bytes, `the ${platform} asset`);
}

function local(dir, platform) {
  const folder = path.join(dir, platform);
  if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) return entriesOfFolder(folder);
  const zips = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(`-${platform}.zip`)) : [];
  if (zips.length !== 1) {
    throw new Error(`${dir} holds ${zips.length} zips for ${platform} (and no ${platform} folder); it should hold one marigold-core-<version>-${platform}.zip`);
  }
  return entriesOf(fs.readFileSync(path.join(dir, zips[0])), zips[0]);
}

/** Writes the files the layout names; everything for a platform is replaced, not merged. */
function install(root, platform, files) {
  for (const { from, to } of LAYOUT[platform]) {
    const target = path.join(root, to);
    fs.rmSync(target, { recursive: true, force: true });
    for (const [name, bytes] of Object.entries(files)) {
      if (!(from.endsWith('/') ? name.startsWith(from) : name === from)) continue;
      const rest = from.endsWith('/') ? name.slice(from.length) : '';
      const out = rest ? path.join(target, ...rest.split('/')) : target;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, bytes);
    }
  }
}

/**
 * @param {{ root?: string, env?: Record<string, string | undefined>, download?: (url: string) => Promise<Uint8Array>, log?: (line: string) => void }} [options]
 */
async function fetchCore(options = {}) {
  const root = options.root || ROOT;
  const env = options.env || process.env;
  const log = options.log || console.log;
  const download =
    options.download ||
    (async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return new Uint8Array(await response.arrayBuffer());
    });
  const config = JSON.parse(fs.readFileSync(path.join(root, 'marigold-core.json'), 'utf8'));

  // Everything is read and checked first; only then is anything written.
  const got = {};
  for (const platform of ['ios', 'android']) {
    const what = env.MARIGOLD_CORE_DIR ? `${env.MARIGOLD_CORE_DIR} (${platform})` : `the ${platform} asset`;
    got[platform] = env.MARIGOLD_CORE_DIR ? local(env.MARIGOLD_CORE_DIR, platform) : await pinned(config, platform, download);
    check(platform, got[platform], what);
  }
  for (const platform of ['ios', 'android']) {
    install(root, platform, got[platform]);
    const version = got[platform]['VERSION'] ? Buffer.from(got[platform]['VERSION']).toString('utf8').trim() : 'unknown';
    log(`${platform}: the core ${version}, ${Object.keys(got[platform]).length} files`);
  }
  return { ios: Object.keys(got.ios), android: Object.keys(got.android) };
}

module.exports = { fetchCore, LAYOUT };

if (require.main === module) {
  fetchCore().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
