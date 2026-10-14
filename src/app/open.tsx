import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { core, startCore, wordsFor } from '../lib/core';
import { pinIsKept, recallPin } from '../lib/secrets';

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
      await core.open(wallet, typed);
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>
        Open {wallet}
      </Text>
      <Text style={styles.label}>Your PIN</Text>
      <TextInput testID="pin" style={styles.input} value={pin} onChangeText={setPin} secureTextEntry textContentType="oneTimeCode" autoComplete="off" autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => open(pin)} />
      {busy && said ? <Text style={styles.text}>{said}</Text> : null}
      {problem ? (
        <Text testID="problem" style={styles.problem}>
          {problem}
        </Text>
      ) : null}
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} testID="open-wallet" onPress={() => open(pin)}>
        <Text style={styles.buttonText}>{busy ? 'Opening…' : 'Open my wallet'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: '#ffffff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '600' },
  label: { fontSize: 16, color: '#333333' },
  text: { fontSize: 16, color: '#333333' },
  input: { borderWidth: 1, borderColor: '#999999', borderRadius: 8, padding: 12, fontSize: 18 },
  problem: { fontSize: 16, color: '#a00000' },
  button: { backgroundColor: '#1d3a5f', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18 },
});
