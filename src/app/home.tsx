import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { core, wordsFor } from '../lib/core';

/** The open wallet: its balance and how it reaches the network. PH-M7b makes this the real Home screen. */
export default function Home() {
  const { wallet } = useLocalSearchParams<{ wallet: string }>();
  const [balance, setBalance] = useState('');
  const [status, setStatus] = useState('');
  const [problem, setProblem] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setBalance(await core.balance());
        setStatus(await core.status());
      } catch (error) {
        setProblem(wordsFor(error));
      }
    })();
  }, []);

  async function close() {
    await core.closeWallet();
    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title} testID="home-title">
        {wallet}
      </Text>
      <Text style={styles.text} testID="balance">
        {balance}
      </Text>
      <Text style={styles.text}>{status}</Text>
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
      <Pressable accessibilityRole="button" style={styles.button} testID="close-wallet" onPress={close}>
        <Text style={styles.buttonText}>Close the wallet</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: '#ffffff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '600' },
  text: { fontSize: 16, color: '#333333' },
  problem: { fontSize: 16, color: '#a00000' },
  button: { backgroundColor: '#1d3a5f', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18 },
});
