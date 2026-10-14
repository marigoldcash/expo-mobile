import { router } from 'expo-router';
import { useState } from 'react';

import { Body, Button, Field, PinField, Problem, Screen, Title } from '../components/ui';
import { core, MIN_PIN, startCore, wordsFor } from '../lib/core';

/** Brings a wallet back from its 24 words, with a PIN of the person's choosing. Its notes come back from a backup. */
export default function Restore() {
  const [name, setName] = useState('');
  const [words, setWords] = useState('');
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  async function restore() {
    setProblem('');
    if (pin !== again) {
      setProblem('The two PINs are not the same.');
      return;
    }
    setBusy(true);
    try {
      startCore();
      const back = await core.restoreFromWords(name.trim() || 'marigold', pin, words);
      router.replace({ pathname: '/open', params: { wallet: back.filename } });
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Bring a wallet back</Title>
      <Body>Type the 24 words of your wallet, with a space between them, and choose a PIN for this phone. The notes the wallet held come back from your latest backup.</Body>
      <Field label="Its name" testID="wallet-name" value={name} onChangeText={setName} placeholder="marigold" />
      <Field label="The 24 words" testID="words" value={words} onChangeText={setWords} multiline numberOfLines={4} />
      <PinField label={`A PIN, at least ${MIN_PIN} characters`} testID="pin" value={pin} onChangeText={setPin} />
      <PinField label="The PIN once more" testID="pin-again" value={again} onChangeText={setAgain} />
      <Problem>{problem}</Problem>
      <Button label={busy ? 'Bringing it back…' : 'Bring my wallet back'} disabled={busy} testID="restore-wallet" onPress={restore} />
    </Screen>
  );
}
