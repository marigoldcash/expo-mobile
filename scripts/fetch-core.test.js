// The fetch script against fixtures: zips built here, a download that is only a function. No network.
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');

const { fetchCore } = require('./fetch-core');

const iosFiles = {
  'VERSION': strToU8('9.9.9\n'),
  'MarigoldCore.xcframework/Info.plist': strToU8('<plist/>'),
  'MarigoldCore.xcframework/ios-arm64/libkaspa_wallet_service.a': strToU8('device'),
  'MarigoldCore.xcframework/ios-arm64-simulator/libkaspa_wallet_service.a': strToU8('simulator'),
  'swift/MarigoldCore.swift': strToU8('// swift'),
};
const androidFiles = {
  'VERSION': strToU8('9.9.9\n'),
  'jniLibs/arm64-v8a/libkaspa_wallet_service.so': strToU8('arm64'),
  'jniLibs/x86_64/libkaspa_wallet_service.so': strToU8('x86_64'),
  'kotlin/cash/marigold/core/kaspa_wallet_service.kt': strToU8('// kotlin'),
};
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-core-'));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function pin(ios, android) {
  fs.writeFileSync(
    path.join(root, 'marigold-core.json'),
    JSON.stringify({
      tag: 'v9.9.9',
      assets: {
        ios: { url: 'https://example.test/ios.zip', sha256: sha(ios) },
        android: { url: 'https://example.test/android.zip', sha256: sha(android) },
      },
    }),
  );
}
const served = (map) => async (url) => {
  if (!(url in map)) throw new Error('404 Not Found');
  return map[url];
};
const moduleDir = () => path.join(root, 'modules', 'marigold-core');
const written = () => fs.existsSync(moduleDir());
const quiet = () => {};

describe('the pinned release', () => {
  it('downloads both assets, checks them and unpacks them into the native module', async () => {
    const ios = zipSync(iosFiles);
    const android = zipSync(androidFiles);
    pin(ios, android);
    await fetchCore({ root, env: {}, log: quiet, download: served({ 'https://example.test/ios.zip': ios, 'https://example.test/android.zip': android }) });
    expect(fs.readFileSync(path.join(moduleDir(), 'ios/Generated/MarigoldCore.swift'), 'utf8')).toBe('// swift');
    expect(fs.readFileSync(path.join(moduleDir(), 'ios/Frameworks/MarigoldCore.xcframework/ios-arm64-simulator/libkaspa_wallet_service.a'), 'utf8')).toBe('simulator');
    expect(fs.readFileSync(path.join(moduleDir(), 'android/src/main/jniLibs/x86_64/libkaspa_wallet_service.so'), 'utf8')).toBe('x86_64');
    expect(fs.readFileSync(path.join(moduleDir(), 'android/src/main/generated/cash/marigold/core/kaspa_wallet_service.kt'), 'utf8')).toBe('// kotlin');
  });

  it('refuses a wrong checksum and unpacks nothing, not even the asset that was right', async () => {
    const ios = zipSync(iosFiles);
    const android = zipSync(androidFiles);
    pin(ios, android);
    const tampered = zipSync({ ...androidFiles, 'jniLibs/x86_64/libkaspa_wallet_service.so': strToU8('not what was built') });
    await expect(
      fetchCore({ root, env: {}, log: quiet, download: served({ 'https://example.test/ios.zip': ios, 'https://example.test/android.zip': tampered }) }),
    ).rejects.toThrow(/wrong checksum/);
    expect(written()).toBe(false);
  });

  it('says so when an asset is missing, and unpacks nothing', async () => {
    const ios = zipSync(iosFiles);
    pin(ios, zipSync(androidFiles));
    await expect(fetchCore({ root, env: {}, log: quiet, download: served({ 'https://example.test/ios.zip': ios }) })).rejects.toThrow(/android asset could not be downloaded/);
    expect(written()).toBe(false);
  });

  it('refuses a zip that is not the core, even with the right checksum', async () => {
    const wrong = zipSync({ 'readme.txt': strToU8('hello') });
    pin(zipSync(iosFiles), wrong);
    await expect(
      fetchCore({ root, env: {}, log: quiet, download: served({ 'https://example.test/ios.zip': zipSync(iosFiles), 'https://example.test/android.zip': wrong }) }),
    ).rejects.toThrow(/does not hold what the core's android asset holds/);
    expect(written()).toBe(false);
  });

  it('says that no release is pinned yet', async () => {
    fs.writeFileSync(path.join(root, 'marigold-core.json'), JSON.stringify({ tag: '', assets: {} }));
    await expect(fetchCore({ root, env: {}, log: quiet })).rejects.toThrow(/names no release of the core yet/);
    expect(written()).toBe(false);
  });
});

describe('a local build', () => {
  it('is read from a folder of the two zips, and the network is not used', async () => {
    const local = fs.mkdtempSync(path.join(os.tmpdir(), 'core-local-'));
    fs.writeFileSync(path.join(local, 'marigold-core-9.9.9-ios.zip'), zipSync(iosFiles));
    fs.writeFileSync(path.join(local, 'marigold-core-9.9.9-android.zip'), zipSync(androidFiles));
    fs.writeFileSync(path.join(root, 'marigold-core.json'), JSON.stringify({ tag: '', assets: {} }));
    const download = jest.fn();
    await fetchCore({ root, env: { MARIGOLD_CORE_DIR: local }, log: quiet, download });
    expect(download).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(moduleDir(), 'ios/Frameworks/MarigoldCore.xcframework/Info.plist'))).toBe(true);
    fs.rmSync(local, { recursive: true, force: true });
  });

  it('is read from the folders the zips unpack to', async () => {
    const local = fs.mkdtempSync(path.join(os.tmpdir(), 'core-local-'));
    for (const [platform, files] of [['ios', iosFiles], ['android', androidFiles]]) {
      for (const [name, bytes] of Object.entries(files)) {
        const out = path.join(local, platform, name);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, bytes);
      }
    }
    fs.writeFileSync(path.join(root, 'marigold-core.json'), JSON.stringify({ tag: '', assets: {} }));
    await fetchCore({ root, env: { MARIGOLD_CORE_DIR: local }, log: quiet });
    expect(fs.existsSync(path.join(moduleDir(), 'android/src/main/jniLibs/arm64-v8a/libkaspa_wallet_service.so'))).toBe(true);
    fs.rmSync(local, { recursive: true, force: true });
  });

  it('says what is missing from the folder', async () => {
    const local = fs.mkdtempSync(path.join(os.tmpdir(), 'core-local-'));
    fs.writeFileSync(path.join(local, 'marigold-core-9.9.9-ios.zip'), zipSync(iosFiles));
    fs.writeFileSync(path.join(root, 'marigold-core.json'), JSON.stringify({ tag: '', assets: {} }));
    await expect(fetchCore({ root, env: { MARIGOLD_CORE_DIR: local }, log: quiet })).rejects.toThrow(/holds 0 zips for android/);
    expect(written()).toBe(false);
    fs.rmSync(local, { recursive: true, force: true });
  });
});

describe('the script', () => {
  it('never builds anything: no cargo, rustc or rustup in it', () => {
    const source = fs.readFileSync(path.join(__dirname, 'fetch-core.js'), 'utf8');
    // The words are written in pieces so that this file does not contain them either.
    const tools = ['car' + 'go', 'rust' + 'c', 'rust' + 'up'];
    for (const tool of tools) expect(source.toLowerCase()).not.toContain(tool);
  });
});
