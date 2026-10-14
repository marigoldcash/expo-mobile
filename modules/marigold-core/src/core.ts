import type { MarigoldCoreNative } from './MarigoldCoreModule';
import type {
  BackupInfo,
  Classified,
  CoreEvents,
  Created,
  Given,
  LightInfo,
  Opened,
  PaidOut,
  Probe,
  Requested,
  WalletEntry,
} from './types';

/** Why a call did not do what was asked. `message` holds the words to show the person. */
export type WalletErrorCode = 'NoWalletOpen' | 'Network' | 'Failed' | 'NotConfigured';

export class WalletError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

/**
 * The core's errors arrive from the native side wrapped by Expo ("Call to function … has been rejected. → Caused by: …"),
 * which hides the code. The native modules therefore put a marker in front of the words, `marigold:<code>:<words>`, and
 * this takes it out again. Anything else is left as it is.
 */
function translated(error: unknown): unknown {
  const message = (error as { message?: unknown } | null)?.message;
  if (typeof message === 'string') {
    const marked = /marigold:(NoWalletOpen|Network|Failed|NotConfigured):([\s\S]*)$/.exec(message);
    if (marked) return new WalletError(marked[1] as WalletErrorCode, marked[2].trim());
  }
  return error;
}

async function asked<T>(call: () => Promise<T> | T): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw translated(error);
  }
}

export interface Subscription {
  remove(): void;
}

/** The typed face of the wallet core. Build it over the native module (the app does; the tests give it a stand-in). */
export function createCore(native: MarigoldCoreNative) {
  return {
    /** The version of the Rust core. */
    version: (): string => native.version(),
    /** Starts the core on the app's own wallets folder. The network is testnet-10 unless named. */
    configure: (network?: string): Probe => {
      try {
        return native.configure(network ?? null);
      } catch (error) {
        throw translated(error);
      }
    },
    listWallets: (): Promise<WalletEntry[]> => asked(() => native.listWallets()),
    /** A password under four characters is refused unless `allowEmpty` (the advanced choice of none) is set. */
    createWallet: (name: string, password: string, allowEmpty = false): Promise<Created> =>
      asked(() => native.createWallet(name, password, allowEmpty)),
    restoreFromWords: (name: string, password: string, words: string): Promise<Created> =>
      asked(() => native.restoreFromWords(name, password, words)),
    restoreTelegram: (token: string, words: string, name: string): Promise<string> =>
      asked(() => native.restoreTelegram(token, words, name)),
    /** `node` is "public" for a public computer, or a ws:// address. */
    open: (wallet: string, password: string, node = 'public'): Promise<Opened> => asked(() => native.open(wallet, password, node)),
    closeWallet: (): Promise<void> => asked(() => native.closeWallet()),
    balance: (): Promise<string> => asked(() => native.balance()),
    status: (): Promise<string> => asked(() => native.status()),
    history: (): Promise<string> => asked(() => native.history()),
    /** Takes a code somebody handed over: a hand-over, a locked hand-over, or a bare note. */
    receive: (code: string): Promise<string> => asked(() => native.receive(code)),
    /** A request for payment; an empty amount lets the payer choose. */
    request: (amount = ''): Promise<Requested> => asked(() => native.request(amount)),
    /** Waits up to `seconds` for a request to be paid; null when it was not yet. */
    waitRequest: (code: string, seconds: number): Promise<string | null> => asked(() => native.waitRequest(code, seconds)),
    /** What a pasted code is, before anything is done with it. */
    payPreview: (code: string): Classified => {
      try {
        return native.payPreview(code);
      } catch (error) {
        throw translated(error);
      }
    },
    /** `amount` is used only when the request pins none. */
    pay: (code: string, amount = ''): Promise<PaidOut> => asked(() => native.pay(code, amount)),
    shareKey: (): Promise<string> => asked(() => native.shareKey()),
    give: (amount: string, key = '', minutes = 60): Promise<Given> => asked(() => native.give(amount, key, minutes)),
    recoveryWords: (password: string): Promise<string> => asked(() => native.recoveryWords(password)),
    changePassword: (old: string, next: string, allowEmpty = false): Promise<void> =>
      asked(() => native.changePassword(old, next, allowEmpty)),
    backupStatus: (): Promise<BackupInfo> => asked(() => native.backupStatus()),
    backupNow: (): Promise<string> => asked(() => native.backupNow()),
    backupAutomatic: (on: boolean): Promise<void> => asked(() => native.backupAutomatic(on)),
    backupDecline: (): Promise<void> => asked(() => native.backupDecline()),
    backupCover: (name: string, words: string): Promise<void> => asked(() => native.backupCover(name, words)),
    telegramSetup: (token: string, pin: string): Promise<string> => asked(() => native.telegramSetup(token, pin)),
    lightStatus: (): Promise<LightInfo> => asked(() => native.lightStatus()),
    /** Hears the core while a wallet is open: `say`, `notesChanged`, `connection`. */
    on: <K extends keyof CoreEvents>(event: K, listener: (payload: CoreEvents[K]) => void): Subscription =>
      native.addListener(event, listener as never),
  };
}

export type Core = ReturnType<typeof createCore>;
