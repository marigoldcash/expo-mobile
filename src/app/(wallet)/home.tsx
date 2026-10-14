import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { Body, Problem, Screen, Title } from '../../components/ui';
import { useConnection } from '../../lib/connection';
import { core, wordsFor } from '../../lib/core';
import { takePendingCode } from '../../lib/links';
import { openWallet } from '../../lib/session';

/** The open wallet: what it holds, how it reaches the network, and what happened last. */
export default function Home() {
  const [balance, setBalance] = useState('');
  const [history, setHistory] = useState('');
  const [problem, setProblem] = useState('');
  const connection = useConnection();

  const refresh = useCallback(async () => {
    try {
      setBalance(await core.balance());
      setHistory(await core.history());
      setProblem('');
    } catch (error) {
      setProblem(wordsFor(error));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      // A link that was opened before the wallet was: its code goes to the Pay screen now.
      const waiting = takePendingCode();
      if (waiting) router.push({ pathname: '/pay', params: { code: waiting } });
    }, [refresh]),
  );
  useEffect(() => {
    const heard = core.on('notesChanged', () => {
      refresh();
    });
    return () => heard.remove();
  }, [refresh]);

  return (
    <Screen inTabs>
      <Title>{openWallet() || 'Your wallet'}</Title>
      <Body testID="balance">{balance}</Body>
      <Body testID="connection">{connection.words}</Body>
      <Title>Latest</Title>
      <Body testID="latest">{history || 'Nothing has come in or gone out yet.'}</Body>
      <Problem>{problem}</Problem>
    </Screen>
  );
}
