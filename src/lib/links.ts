// The links the wallet opens: `marigoldpay:<code>` and `marigoldreq:<code>`, handed to it by another app, a message or the
// camera. The part after the scheme is the code the Pay screen reads; a bare code (what a QR holds) is a code too.

const SCHEME = /^marigold(?:pay|req):(?:\/\/)?/i;

/** The code inside a link, or the text itself when it is already a code; null for nothing. */
export function codeFromLink(text: string | null | undefined): string | null {
  const trimmed = (text ?? '').trim();
  if (trimmed === '') return null;
  const code = trimmed.replace(SCHEME, '').trim();
  return code === '' ? null : code;
}

/** Whether the text is one of the wallet's own links. */
export function isWalletLink(text: string): boolean {
  return SCHEME.test(text.trim());
}

/** The link that hands a request to another wallet: what Share sends. */
export function requestLink(code: string): string {
  return `marigoldreq:${code}`;
}

// A code that arrived while no wallet was open waits here and is handed to the Pay screen once one is.
let pending: string | null = null;

export function holdCode(code: string) {
  pending = code;
}

/** Takes the waiting code, if there is one. */
export function takePendingCode(): string | null {
  const code = pending;
  pending = null;
  return code;
}
