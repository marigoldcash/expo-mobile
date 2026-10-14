import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Problem, Screen, Title } from '../components/ui';
import { core, startCore, wordsFor } from '../lib/core';
import { useTheme } from '../lib/theme';
import type { WalletEntry } from '../../modules/marigold-core';

/** The first screen: the name, the wallets on this phone, and the ways to make or bring one. The version is for support. */
export default function Start() {
  const [wallets, setWallets] = useState<WalletEntry[] | null>(null);
  const [problem, setProblem] = useState('');
  const theme = useTheme();

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
    <Screen>
      <View style={styles.centre}>
        <Title>Marigold</Title>
        <Text maxFontSizeMultiplier={2} style={[styles.version, { color: theme.quietText }]} testID="core-version">
          Core {core.version()}
        </Text>
      </View>
      <Problem>{problem}</Problem>
      {wallets?.map((wallet) => (
        <Button key={wallet.filename} label={wallet.title} testID={`wallet-${wallet.filename}`} onPress={() => router.push({ pathname: '/open', params: { wallet: wallet.filename } })} />
      ))}
      <Button label="Bring a wallet back from its 24 words" quiet testID="restore-wallet-link" onPress={() => router.push('/restore')} />
      <Button label="Make a new wallet" testID="create-wallet" onPress={() => router.push('/create')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', gap: 4, marginVertical: 24 },
  version: { fontSize: 14 },
});
