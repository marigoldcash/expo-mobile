import core, { type Probe } from '../../modules/marigold-core';

let probe: Probe | null = null;

/** Starts the core on the app's own wallets folder, once, and says where the wallets are. */
export function startCore(): Probe {
  if (!probe) probe = core.configure();
  return probe;
}

export { core };

/** The words to show for anything that went wrong: the core's own, or a plain fallback. */
export function wordsFor(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.length > 0 ? message : 'Something went wrong. Please try again.';
}

/** The shortest PIN the wallet accepts; the core checks it too and says so in words. */
export const MIN_PIN = 4;
