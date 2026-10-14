import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

import { Body, Button, Field, Problem, Screen, Title } from '../../components/ui';
import { core, wordsFor } from '../../lib/core';
import type { Classified, PaidOut } from '../../../modules/marigold-core';

/** Pays a request code, or takes a note or hand-over somebody gave. Shows what it will do before it does it. */
export default function Pay() {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<Classified | null>(null);
  const [paid, setPaid] = useState<PaidOut | null>(null);
  const [taken, setTaken] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  function look(text: string) {
    setCode(text);
    setPaid(null);
    setTaken('');
    setProblem('');
    if (text.trim() === '') {
      setPreview(null);
      return;
    }
    try {
      setPreview(core.payPreview(text));
    } catch (error) {
      setPreview(null);
      setProblem(wordsFor(error));
    }
  }

  async function pay() {
    setProblem('');
    setBusy(true);
    try {
      setPaid(await core.pay(code, amount));
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function take() {
    setProblem('');
    setBusy(true);
    try {
      setTaken(await core.receive(code));
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Pay or take a code</Title>
      <Field label="The code" testID="code" value={code} onChangeText={look} multiline numberOfLines={3} />
      <Button label="Paste from the clipboard" quiet testID="paste" onPress={async () => look(await Clipboard.getStringAsync())} />
      {preview?.kind === 'request' ? (
        <>
          <Body testID="preview">{preview.amount ? `A request for ${preview.amount}.` : 'A request that lets you choose the amount.'}</Body>
          {preview.amount ? null : <Field label="The amount to pay" testID="pay-amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />}
          <Button label={busy ? 'Paying…' : 'Pay it'} disabled={busy} testID="confirm-pay" onPress={pay} />
        </>
      ) : null}
      {preview && (preview.kind === 'handover' || preview.kind === 'note') ? (
        <>
          <Body testID="preview">Somebody has handed you notes.</Body>
          <Button label={busy ? 'Taking them…' : 'Take them'} disabled={busy} testID="confirm-take" onPress={take} />
        </>
      ) : null}
      {preview?.kind === 'receipt' ? <Body testID="preview">This is a receipt for a payment that was made, not something to pay.</Body> : null}
      {preview?.kind === 'unknown' ? <Body testID="preview">This is not a code the wallet knows. Check that all of it was copied.</Body> : null}
      {paid ? (
        <Body testID="paid">
          Paid {paid.value}, and {paid.fee} to the network. {paid.receipt}
        </Body>
      ) : null}
      {taken ? <Body testID="taken">{taken}</Body> : null}
      <Problem>{problem}</Problem>
    </Screen>
  );
}
