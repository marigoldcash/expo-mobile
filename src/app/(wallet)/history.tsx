import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Body, Problem, Screen, Title } from '../../components/ui';
import { core, wordsFor } from '../../lib/core';

/** What came in and went out, in the wallet's own words. */
export default function History() {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setText(await core.history());
          setProblem('');
        } catch (error) {
          setProblem(wordsFor(error));
        }
      })();
    }, []),
  );

  return (
    <Screen inTabs>
      <Title>History</Title>
      <Body testID="history">{text || 'Nothing has come in or gone out yet.'}</Body>
      <Problem>{problem}</Problem>
    </Screen>
  );
}
