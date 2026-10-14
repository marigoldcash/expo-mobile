// The shapes the Rust core hands over, as the native module delivers them. Amounts are the text a person reads, in the
// wallet's own units; the core makes them, and the app shows them as they are.

/** Where the wallets live and which network they are on. */
export interface Probe {
  folder: string;
  network: string;
}

export interface WalletEntry {
  filename: string;
  title: string;
}

export interface Created {
  filename: string;
  /** The 24 words, space-separated: the whole wallet comes back from them. */
  words: string;
}

export interface Opened {
  wallet: string;
  network: string;
  /** How the wallet reaches the network, in the words the open screen uses. */
  access: string;
  ticker: string;
}

/** What a pasted code is: "request", "handover", "note", "receipt" or "unknown"; a request's pinned amount, if any. */
export interface Classified {
  kind: 'request' | 'handover' | 'note' | 'receipt' | 'unknown';
  amount: string;
}

export interface PaidOut {
  receipt: string;
  value: string;
  fee: string;
  notes: number;
}

export interface Given {
  code: string;
  value: string;
  fee: string;
  notes: number;
}

export interface Requested {
  code: string;
  amount: string;
}

/** The wallet's own copy of the notes, checked against the trustees' anchors. */
export interface LightInfo {
  active: boolean;
  notes: number;
  anchoredDaa: number;
  checkedMs: number;
}

export interface BackupInfo {
  destination: string;
  bot: boolean;
  paired: boolean;
  pairingCode: string | null;
  automatic: string;
  offer: boolean;
  checkpointAt: number;
  checkpointBytes: number;
  deltas: number;
  lastPostAt: number;
  wallets: string[];
  uncovered: string[];
  folder: string | null;
}

/** What the app hears from the core while a wallet is open. */
export interface CoreEvents {
  /** A line for the person, in plain words. */
  say: { line: string };
  /** The balance or the notes changed. */
  notesChanged: Record<string, never>;
  /** The connection to the node came or went. */
  connection: { connected: boolean };
}
