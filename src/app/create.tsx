import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Switch, TextInput, View } from 'react-native';

import { Body, Button, Field, PinField, Problem, Screen, Title, WordsBox } from '../components/ui';
import { core, MIN_PIN, startCore, wordsFor } from '../lib/core';
import { biometricsAvailable, rememberPin } from '../lib/secrets';
import { advancedOn } from '../lib/settings';
import { pickTwo, wordMatches } from '../lib/words';

/** Makes a wallet: a name, a PIN, the 24 words shown once, and two of them asked back. */
export default function Create() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [problem, setProblem] = useState('');
  const [made, setMade] = useState<{ filename: string; words: string } | null>(null);
  const [asked, setAsked] = useState<[number, number]>([0, 1]);
  const [typed, setTyped] = useState(['', '']);
  const [busy, setBusy] = useState(false);
  const second = useRef<TextInput>(null);

  useEffect(() => {
    biometricsAvailable().then(setCanUseBiometrics);
    advancedOn().then(setAdvanced);
  }, []);

  async function make() {
    setProblem('');
    if (pin !== again) {
      setProblem('The two PINs are not the same.');
      return;
    }
    setBusy(true);
    try {
      startCore();
      const created = await core.createWallet(name.trim() || 'marigold', pin, advanced);
      if (canUseBiometrics && useBiometrics && pin !== '') await rememberPin(created.filename, pin);
      setAsked(pickTwo(24));
      setMade(created);
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  if (made) {
    const right = wordMatches(made.words, asked[0], typed[0]) && wordMatches(made.words, asked[1], typed[1]);
    return (
      <Screen>
        <Title>Your wallet is made</Title>
        <Body>Write these 24 words on paper, in this order, and keep the paper somewhere safe. They bring your wallet back if you lose this phone. They are shown now, and again later only against your PIN.</Body>
        <WordsBox testID="recovery-words">{made.words}</WordsBox>
        <Body>To check the paper, type the words it has at these two places.</Body>
        <View style={{ gap: 12 }}>
          {asked.map((place, i) => (
            <Field
              key={place}
              label={`Word number ${place + 1}`}
              testID={`check-${i + 1}`}
              inputRef={i === 1 ? second : undefined}
              keyboardType="visible-password"
              spellCheck={false}
              returnKeyType={i === 0 ? 'next' : 'done'}
              onSubmitEditing={i === 0 ? () => second.current?.focus() : undefined}
              value={typed[i]}
              onChangeText={(text) => setTyped((now) => now.map((t, j) => (j === i ? text : t)))}
            />
          ))}
        </View>
        <Button label="I have written them down" disabled={!right} testID="words-written" onPress={() => router.replace({ pathname: '/open', params: { wallet: made.filename } })} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Make a new wallet</Title>
      <Field label="Its name" testID="wallet-name" value={name} onChangeText={setName} placeholder="marigold" />
      <PinField label={`A PIN, at least ${MIN_PIN} characters`} testID="pin" value={pin} onChangeText={setPin} />
      <PinField label="The PIN once more" testID="pin-again" value={again} onChangeText={setAgain} />
      {canUseBiometrics ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Body>Open it with Face ID or my fingerprint</Body>
          <Switch accessibilityLabel="Open it with Face ID or my fingerprint" testID="use-biometrics" value={useBiometrics} onValueChange={setUseBiometrics} />
        </View>
      ) : null}
      <Problem>{problem}</Problem>
      <Button label={busy ? 'Making it…' : 'Make my wallet'} disabled={busy} testID="make-wallet" onPress={make} />
    </Screen>
  );
}
