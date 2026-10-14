import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { core, startCore, wordsFor } from '../lib/core';
import type { WalletEntry } from '../../modules/marigold-core';

/** The first screen: the name, the version of the Rust core, and the wallets on this phone. */
export default function Start() {
  const [wallets, setWallets] = useState<WalletEntry[] | null>(null);
  const [problem, setProblem] = useState('');

  useFocusEffect(
    useCallback(() => {
      let current = true;
      (async () => {
        try {
          startCore();
          const list = await core.listWallets();
          if (current) setWallets(list);
        } catch (error) {
          if (current) setProblem(wordsFor(error));
        }
      })();
      return () => {
        current = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.name}>
        Marigold
      </Text>
      <Text testID="core-version" style={styles.version}>
        Core {core.version()}
      </Text>
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
      {wallets?.map((wallet) => (
        <Link key={wallet.filename} href={{ pathname: '/open', params: { wallet: wallet.filename } }} asChild>
          <Pressable accessibilityRole="button" style={styles.button} testID={`wallet-${wallet.filename}`}>
            <Text style={styles.buttonText}>{wallet.title}</Text>
          </Pressable>
        </Link>
      ))}
      <Link href="/restore" asChild>
        <Pressable accessibilityRole="button" style={[styles.button, styles.quiet]} testID="restore-wallet-link">
          <Text style={[styles.buttonText, styles.quietText]}>Bring a wallet back from its 24 words</Text>
        </Pressable>
      </Link>
      <Link href="/create" asChild>
        <Pressable accessibilityRole="button" style={styles.button} testID="create-wallet">
          <Text style={styles.buttonText}>Make a new wallet</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  name: { fontSize: 32, fontWeight: '600' },
  version: { fontSize: 16, color: '#555555' },
  problem: { fontSize: 16, color: '#a00000', textAlign: 'center' },
  button: { backgroundColor: '#1d3a5f', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, minWidth: 240, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18, textAlign: 'center' },
  quiet: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#1d3a5f' },
  quietText: { color: '#1d3a5f' },
});
