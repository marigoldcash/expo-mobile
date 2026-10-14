import * as SecureStore from 'expo-secure-store';

// What the person chose in Settings. Nothing here is secret; the phone's secure store is simply the one place the app
// already keeps small things, and it needs no extra package.

const NODE = 'setting.node';
const ADVANCED = 'setting.advanced';

/** How the wallet reaches the network: "public" (a public computer) or a ws:// address of the person's own node. */
export async function nodeChoice(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(NODE)) || 'public';
  } catch {
    return 'public';
  }
}

export async function setNodeChoice(choice: string): Promise<void> {
  const trimmed = choice.trim();
  await SecureStore.setItemAsync(NODE, trimmed === '' ? 'public' : trimmed);
}

/** Whether the advanced switch is on: a wallet may then be made or changed without a password. */
export async function advancedOn(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ADVANCED)) === '1';
  } catch {
    return false;
  }
}

export async function setAdvanced(on: boolean): Promise<void> {
  await SecureStore.setItemAsync(ADVANCED, on ? '1' : '0');
}

/** Whether a node address is one the core can use: public, or a ws:// or wss:// address. */
export function nodeChoiceLooksRight(choice: string): boolean {
  const c = choice.trim();
  return c === '' || c === 'public' || /^wss?:\/\/[^\s/]+(:\d+)?\/?$/.test(c);
}
