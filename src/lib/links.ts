// The links the wallet opens. A code of the wallet is already a link: a request is `marigoldreq:…`, a hand-over
// `marigoldpay:…` or `marigoldpay2:…`, a note `marigoldnote:…`. Another app, a message or the camera hands the whole text
// over, and the Pay screen reads it as the code it is.

const SCHEME = /^marigold(?:req|pay2?|note):(\/\/)?/i;

/** The code in what was handed over: the text itself, without the `//` some apps put after a scheme; null for nothing. */
export function codeFromLink(text: string | null | undefined): string | null {
  const trimmed = (text ?? '').trim();
  if (trimmed === '') return null;
  const code = trimmed.replace(SCHEME, (scheme) => scheme.replace('//', ''));
  return code.replace(/^marigold(?:req|pay2?|note):\s*$/i, '') === '' ? null : code;
}

/** Whether the text is one of the wallet's own links (a code). */
export function isWalletLink(text: string): boolean {
  return SCHEME.test(text.trim());
}

/** What Share sends for a request: the request code, which is the link. */
export function requestLink(code: string): string {
  return code;
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
