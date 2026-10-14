import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { core, MIN_PIN, startCore, wordsFor } from '../lib/core';
import { biometricsAvailable, rememberPin } from '../lib/secrets';

/** Makes a wallet: a name, a PIN, then the 24 words shown once. */
export default function Create() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [problem, setProblem] = useState('');
  const [made, setMade] = useState<{ filename: string; words: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    biometricsAvailable().then(setCanUseBiometrics);
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
      const created = await core.createWallet(name.trim() || 'marigold', pin);
      if (canUseBiometrics && useBiometrics) await rememberPin(created.filename, pin);
      setMade(created);
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  if (made) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Your wallet is made
        </Text>
        <Text style={styles.text}>
          Write these 24 words on paper and keep the paper somewhere safe. They bring your wallet back if you lose this phone. This is the only time they are shown without your PIN.
        </Text>
        <Text selectable style={styles.words} testID="recovery-words">
          {made.words}
        </Text>
        <Pressable accessibilityRole="button" style={styles.button} testID="words-written" onPress={() => router.replace({ pathname: '/open', params: { wallet: made.filename } })}>
          <Text style={styles.buttonText}>I have written them down</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>
        Make a new wallet
      </Text>
      <Text style={styles.label}>Its name</Text>
      <TextInput testID="wallet-name" style={styles.input} value={name} onChangeText={setName} placeholder="marigold" autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.label}>A PIN, at least {MIN_PIN} characters</Text>
      <TextInput testID="pin" style={styles.input} value={pin} onChangeText={setPin} secureTextEntry autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.label}>The PIN once more</Text>
      <TextInput testID="pin-again" style={styles.input} value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" autoCorrect={false} />
      {canUseBiometrics ? (
        <View style={styles.row}>
          <Text style={styles.text}>Open it with Face ID or my fingerprint</Text>
          <Switch testID="use-biometrics" value={useBiometrics} onValueChange={setUseBiometrics} />
        </View>
      ) : null}
      {problem ? (
        <Text testID="problem" style={styles.problem}>
          {problem}
        </Text>
      ) : null}
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} testID="make-wallet" onPress={make}>
        <Text style={styles.buttonText}>{busy ? 'Making it…' : 'Make my wallet'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: '#ffffff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '600' },
  label: { fontSize: 16, color: '#333333' },
  text: { fontSize: 16, color: '#333333', flexShrink: 1 },
  words: { fontSize: 20, lineHeight: 30, backgroundColor: '#f4f4f4', padding: 12, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#999999', borderRadius: 8, padding: 12, fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  problem: { fontSize: 16, color: '#a00000' },
  button: { backgroundColor: '#1d3a5f', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18 },
});
