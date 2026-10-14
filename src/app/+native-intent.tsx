import { codeFromLink, holdCode, isWalletLink } from '../lib/links';
import { openWallet } from '../lib/session';

/**
 * A `marigoldpay:` or `marigoldreq:` link is not a place in the app: it carries a code. With a wallet open the code goes
 * to the Pay screen; with none open it waits, and goes there once one is.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  const code = isWalletLink(path) ? codeFromLink(path) : null;
  if (!code) return path;
  if (openWallet()) return `/pay?code=${encodeURIComponent(code)}`;
  holdCode(code);
  return '/';
}
