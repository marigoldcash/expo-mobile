import { WalletError, createCore } from './core';
import type { MarigoldCoreNative } from './MarigoldCoreModule';

/** A stand-in for the native module: every function the wrapper calls is a mock that records what it was given. */
function standIn() {
  const answers = {
    version: '9.9.9',
    configure: { folder: '/wallets', network: 'testnet-10' },
    listWallets: [{ filename: 'ph', title: 'ph' }],
    createWallet: { filename: 'ph', words: 'one two' },
    restoreFromWords: { filename: 'ph', words: 'one two' },
    restoreTelegram: 'Restored',
    open: { wallet: 'ph', network: 'testnet-10', access: 'a public computer', ticker: 'TMAGLD' },
    closeWallet: undefined,
    balance: '1 TMAGLD',
    status: 'Using a public computer',
    history: 'nothing yet',
    receive: 'Received',
    request: { code: 'marigoldreq:abc', amount: '2' },
    waitRequest: null,
    payPreview: { kind: 'request', amount: '2' },
    pay: { receipt: 'marigoldpaid:abc', value: '2', fee: '0.001', notes: 1 },
    shareKey: 'marigoldkey:abc',
    give: { code: 'marigoldnote:abc', value: '2', fee: '0.001', notes: 1 },
    recoveryWords: 'one two',
    changePassword: undefined,
    backupStatus: { destination: 'nowhere yet', bot: false, paired: false, pairingCode: null, automatic: 'not started', offer: false, checkpointAt: 0, checkpointBytes: 0, deltas: 0, lastPostAt: 0, wallets: [], uncovered: [], folder: null },
    backupNow: 'Backed up',
    backupAutomatic: undefined,
    backupDecline: undefined,
    backupCover: undefined,
    telegramSetup: '1234',
    lightStatus: { active: true, notes: 951, anchoredDaa: 33789900, checkedMs: 1 },
  } as const;
  const native: Record<string, jest.Mock> = {};
  for (const [name, answer] of Object.entries(answers)) {
    const sync = name === 'version' || name === 'configure' || name === 'payPreview';
    native[name] = jest.fn(() => (sync ? answer : Promise.resolve(answer)));
  }
  native.addListener = jest.fn(() => ({ remove: jest.fn() }));
  return { native, answers, core: createCore(native as unknown as MarigoldCoreNative) };
}

describe('every operation of the core', () => {
  it('passes its arguments to the native side and returns what it answers', async () => {
    const { native, answers, core } = standIn();

    expect(core.version()).toBe('9.9.9');
    expect(core.configure()).toEqual(answers.configure);
    expect(native.configure).toHaveBeenCalledWith(null);
    core.configure('testnet-10');
    expect(native.configure).toHaveBeenLastCalledWith('testnet-10');

    expect(await core.listWallets()).toEqual(answers.listWallets);
    expect(await core.createWallet('ph', 'hunter2')).toEqual(answers.createWallet);
    expect(native.createWallet).toHaveBeenCalledWith('ph', 'hunter2', false);
    expect(await core.restoreFromWords('ph', 'hunter2', 'one two')).toEqual(answers.restoreFromWords);
    expect(await core.restoreTelegram('token', 'one two', 'ph')).toBe('Restored');
    expect(await core.open('ph', 'hunter2')).toEqual(answers.open);
    expect(native.open).toHaveBeenCalledWith('ph', 'hunter2', 'public');
    await core.closeWallet();
    expect(native.closeWallet).toHaveBeenCalledTimes(1);
    expect(await core.balance()).toBe('1 TMAGLD');
    expect(await core.status()).toBe('Using a public computer');
    expect(await core.history()).toBe('nothing yet');
    expect(await core.receive('marigoldnote:abc')).toBe('Received');
    expect(await core.request()).toEqual(answers.request);
    expect(native.request).toHaveBeenCalledWith('');
    expect(await core.waitRequest('marigoldreq:abc', 30)).toBeNull();
    expect(core.payPreview('marigoldreq:abc')).toEqual(answers.payPreview);
    expect(await core.pay('marigoldreq:abc')).toEqual(answers.pay);
    expect(native.pay).toHaveBeenCalledWith('marigoldreq:abc', '');
    expect(await core.shareKey()).toBe('marigoldkey:abc');
    expect(await core.give('2')).toEqual(answers.give);
    expect(native.give).toHaveBeenCalledWith('2', '', 60);
    expect(await core.recoveryWords('hunter2')).toBe('one two');
    await core.changePassword('hunter2', 'newpass');
    expect(native.changePassword).toHaveBeenCalledWith('hunter2', 'newpass', false);
    expect(await core.backupStatus()).toEqual(answers.backupStatus);
    expect(await core.backupNow()).toBe('Backed up');
    await core.backupAutomatic(true);
    expect(native.backupAutomatic).toHaveBeenCalledWith(true);
    await core.backupDecline();
    await core.backupCover('ph', 'one two');
    expect(await core.telegramSetup('token', '1234')).toBe('1234');
    expect(await core.lightStatus()).toEqual(answers.lightStatus);
  });

  it('is exactly the operations the native side has, no more and no fewer', () => {
    const { native, core } = standIn();
    const wrapped = Object.keys(core).filter((name) => name !== 'on');
    expect(wrapped.sort()).toEqual(Object.keys(native).filter((name) => name !== 'addListener').sort().map((name) => (name === 'closeWallet' ? 'closeWallet' : name)));
  });
});

describe('errors', () => {
  it('arrive as a WalletError with a code and the words to show', async () => {
    const { native, core } = standIn();
    // As Expo delivers it: wrapped, with its own code, and our marker in the words.
    native.open.mockRejectedValueOnce(
      Object.assign(new Error("Call to function 'MarigoldCore.open' has been rejected.\n→ Caused by: marigold:Failed:That is not this wallet's password."), {
        code: 'ERR_FUNCTION_CALL_REJECTED',
      }),
    );
    const error = await core.open('ph', 'wrong').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WalletError);
    expect((error as WalletError).code).toBe('Failed');
    expect((error as WalletError).message).toBe("That is not this wallet's password.");
  });

  it('are the same for the calls that answer at once', () => {
    const { native, core } = standIn();
    native.payPreview.mockImplementationOnce(() => {
      throw Object.assign(new Error('marigold:Failed:that is not an amount'), { code: 'ERR_FUNCTION_CALL_REJECTED' });
    });
    expect(() => core.payPreview('x')).toThrow(WalletError);
  });

  it('leave anything that is not the core`s as it was', async () => {
    const { native, core } = standIn();
    const odd = new TypeError('something else');
    native.balance.mockRejectedValueOnce(odd);
    await expect(core.balance()).rejects.toBe(odd);
  });
});

describe('errors from iOS', () => {
  it('lose the place in the code that Expo appends', async () => {
    const { native, core } = standIn();
    native.balance.mockRejectedValueOnce(
      Object.assign(new Error("marigold:Failed:That is not this wallet's password. (at MarigoldCoreExpo/MarigoldCoreModule.swift:165)"), { code: 'ERR_FUNCTION_CALL_REJECTED' }),
    );
    await expect(core.balance()).rejects.toMatchObject({ code: 'Failed', message: "That is not this wallet's password." });
  });
});

describe('events', () => {
  it('are subscribed by name and can be removed', () => {
    const { native, core } = standIn();
    const heard: string[] = [];
    const subscription = core.on('say', (event) => heard.push(event.line));
    expect(native.addListener).toHaveBeenCalledWith('say', expect.any(Function));
    const listener = native.addListener.mock.calls[0][1] as (event: { line: string }) => void;
    listener({ line: 'Opening the wallet…' });
    expect(heard).toEqual(['Opening the wallet…']);
    expect(() => subscription.remove()).not.toThrow();
  });
});
