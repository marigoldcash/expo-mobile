import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { core } from './core';

/** How long the app waits before it tries to reach the network again while it is shown and there is no connection. */
export const RETRY_SECONDS = 15;

/**
 * The words about how the open wallet reaches the network, kept current: read when the screen opens, again whenever the
 * core says the connection came or went, and when the app returns to the foreground, where the core is asked to
 * reconnect and take its copy of the notes afresh. While there is no connection and the app is shown, it tries again
 * every RETRY_SECONDS. Nothing runs while the app is in the background: the phone does not allow it.
 */
export function useConnection(): { connected: boolean; words: string } {
  const [state, setState] = useState({ connected: true, words: 'Connecting…' });

  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const read = async () => {
      try {
        const info = await core.connection();
        if (alive) setState(info);
        return info.connected;
      } catch {
        return true;
      }
    };

    const resume = async () => {
      try {
        await core.resume();
      } catch {
        // The words below say what the person needs to know.
      }
      if (alive) await read();
    };

    const schedule = (connected: boolean) => {
      if (retry) clearTimeout(retry);
      if (!connected && AppState.currentState === 'active') {
        retry = setTimeout(async () => {
          await resume();
          if (alive) schedule(await read());
        }, RETRY_SECONDS * 1000);
      }
    };

    read().then(schedule);
    const heard = core.on('connection', async () => schedule(await read()));
    const focus = AppState.addEventListener('change', async (next) => {
      if (next === 'active') {
        await resume();
        schedule(await read());
      } else if (retry) {
        clearTimeout(retry);
      }
    });

    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
      heard.remove();
      focus.remove();
    };
  }, []);

  return state;
}
