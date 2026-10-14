import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { Body, Button, PinField, Problem, Screen, Title } from '../components/ui';
import { core, startCore, wordsFor } from '../lib/core';
import { pinIsKept, recallPin } from '../lib/secrets';
import { setOpenWallet } from '../lib/session';
import { nodeChoice } from '../lib/settings';

/** Opens a wallet: the phone's own check if a PIN was kept behind it, else the PIN typed. */
export default function Open() {
  const { wallet } = useLocalSearchParams<{ wallet: string }>();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [said, setSaid] = useState('');
  const triedKept = useRef(false);

  async function open(typed: string) {
    setProblem('');
    setBusy(true);
    startCore();
    const heard = core.on('say', (event) => setSaid(event.line));
    try {
      const opened = await core.open(wallet, typed, await nodeChoice());
      setOpenWallet(wallet, opened.ticker);
      router.replace({ pathname: '/home', params: { wallet } });
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      heard.remove();
      setBusy(false);
    }
  }

  useEffect(() => {
    if (triedKept.current || !wallet) return;
    triedKept.current = true;
    (async () => {
      if (await pinIsKept(wallet)) {
        const kept = await recallPin(wallet);
        if (kept) await open(kept);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  return (
    <Screen>
      <Title>Open {wallet}</Title>
      <PinField label="Your PIN" testID="pin" value={pin} onChangeText={setPin} onSubmitEditing={() => open(pin)} />
      {busy && said ? <Body>{said}</Body> : null}
      <Problem>{problem}</Problem>
      <Button label={busy ? 'Opening…' : 'Open my wallet'} disabled={busy} testID="open-wallet" onPress={() => open(pin)} />
    </Screen>
  );
}
