import { NativeModule, requireNativeModule } from 'expo';

import type {
  BackupInfo,
  Classified,
  ConnectionInfo,
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

/** The native side, as the Swift and Kotlin modules declare it. `src/core.ts` puts the typed wrapper in front of it. */
export declare class MarigoldCoreNative extends NativeModule<{
  say(event: CoreEvents['say']): void;
  notesChanged(event: CoreEvents['notesChanged']): void;
  connection(event: CoreEvents['connection']): void;
}> {
  version(): string;
  configure(network: string | null): Probe;
  listWallets(): Promise<WalletEntry[]>;
  createWallet(name: string, password: string, allowEmpty: boolean): Promise<Created>;
  restoreFromWords(name: string, password: string, words: string): Promise<Created>;
  restoreTelegram(token: string, words: string, name: string): Promise<string>;
  open(wallet: string, password: string, node: string): Promise<Opened>;
  closeWallet(): Promise<void>;
  balance(): Promise<string>;
  status(): Promise<string>;
  history(): Promise<string>;
  receive(code: string): Promise<string>;
  request(amount: string): Promise<Requested>;
  waitRequest(code: string, seconds: number): Promise<string | null>;
  payPreview(code: string): Classified;
  pay(code: string, amount: string): Promise<PaidOut>;
  shareKey(): Promise<string>;
  give(amount: string, key: string, minutes: number): Promise<Given>;
  recoveryWords(password: string): Promise<string>;
  changePassword(old: string, next: string, allowEmpty: boolean): Promise<void>;
  backupStatus(): Promise<BackupInfo>;
  backupNow(): Promise<string>;
  backupAutomatic(on: boolean): Promise<void>;
  backupDecline(): Promise<void>;
  backupCover(name: string, words: string): Promise<void>;
  telegramSetup(token: string, pin: string): Promise<string>;
  lightStatus(): Promise<LightInfo>;
  connection(): Promise<ConnectionInfo>;
  resume(): Promise<void>;
}

export default requireNativeModule<MarigoldCoreNative>('MarigoldCore');
