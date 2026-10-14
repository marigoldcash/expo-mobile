import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Body, Button, PinField, Problem, Screen, Title, WordsBox } from '../../components/ui';
import { core, wordsFor } from '../../lib/core';
import { pinIsKept, recallPin } from '../../lib/secrets';
import { openWallet } from '../../lib/session';
import type { BackupInfo } from '../../../modules/marigold-core';

/** What is backed up, a backup now, and the 24 words again against the PIN (or the phone's own check). */
export default function Backup() {
  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [said, setSaid] = useState('');
  const [words, setWords] = useState('');
  const [pin, setPin] = useState('');
  const [asking, setAsking] = useState(false);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setInfo(await core.backupStatus());
    } catch (error) {
      setProblem(wordsFor(error));
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
      setWords('');
      setAsking(false);
      setPin('');
    }, [load]),
  );

  async function backUp() {
    setProblem('');
    setBusy(true);
    try {
      setSaid(await core.backupNow());
      await load();
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function show(typed: string) {
    setProblem('');
    try {
      setWords(await core.recoveryWords(typed));
      setAsking(false);
      setPin('');
    } catch (error) {
      setProblem(wordsFor(error));
    }
  }

  async function showWords() {
    const wallet = openWallet();
    if (wallet && (await pinIsKept(wallet))) {
      const kept = await recallPin(wallet);
      if (kept) return show(kept);
    }
    setAsking(true);
  }

  return (
    <Screen inTabs>
      <Title>Backup</Title>
      <Body testID="backup-destination">{info ? `Your backups go to: ${info.destination}.` : ''}</Body>
      <Body>Your 24 words, on paper, are what bring your wallet back. A backup brings back the notes it held.</Body>
      <Button label={busy ? 'Backing up…' : 'Back up now'} disabled={busy} testID="backup-now" onPress={backUp} />
      {said ? <Body testID="backup-said">{said}</Body> : null}
      <Button label="Show my 24 words" quiet testID="show-words" onPress={showWords} />
      {asking ? (
        <>
          <PinField label="Your PIN" testID="words-pin" value={pin} onChangeText={setPin} onSubmitEditing={() => show(pin)} />
          <Button label="Show them" testID="words-confirm" onPress={() => show(pin)} />
        </>
      ) : null}
      {words ? (
        <WordsBox testID="shown-words">{words}</WordsBox>
      ) : null}
      <Problem>{problem}</Problem>
    </Screen>
  );
}
