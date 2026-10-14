import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Body, Button, Field, Problem, Screen, Title } from '../../components/ui';
import { core, wordsFor } from '../../lib/core';
import { requestLink } from '../../lib/links';
import { useTheme } from '../../lib/theme';

/** A request for payment: a code, as text and as a QR, and a word when it has been paid. */
export default function Receive() {
  const [amount, setAmount] = useState('');
  const [request, setRequest] = useState<{ code: string; amount: string } | null>(null);
  const [paid, setPaid] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const watching = useRef(0);
  const theme = useTheme();

  async function make() {
    setProblem('');
    setPaid('');
    setBusy(true);
    try {
      const made = await core.request(amount);
      setRequest(made);
      watch(made.code);
    } catch (error) {
      setProblem(wordsFor(error));
    } finally {
      setBusy(false);
    }
  }

  // Waits for the request to be paid, a little at a time, for as long as it is shown.
  async function watch(code: string) {
    const mine = ++watching.current;
    while (watching.current === mine) {
      try {
        const done = await core.waitRequest(code, 30);
        if (watching.current !== mine) return;
        if (done) {
          setPaid(done);
          return;
        }
      } catch {
        return;
      }
    }
  }

  useEffect(
    () => () => {
      watching.current += 1;
    },
    [],
  );

  return (
    <Screen inTabs>
      <Title>Receive a payment</Title>
      <Body>Make a request and show it to the person paying you. Leave the amount empty to let them choose.</Body>
      <Field label="Amount (optional)" testID="amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Button label={busy ? 'Making it…' : 'Make a request'} disabled={busy} testID="make-request" onPress={make} />
      <Problem>{problem}</Problem>
      {request ? (
        <View style={{ gap: 12, alignItems: 'center' }}>
          <View accessible accessibilityLabel="The request as a QR code, for the other phone to scan" style={{ backgroundColor: '#ffffff', padding: 12 }}>
            <QRCode value={request.code} size={220} backgroundColor="#ffffff" color="#000000" />
          </View>
          <Text selectable style={{ fontSize: 14, color: theme.text }} testID="request-code">
            {request.code}
          </Text>
          <Button label="Copy the code" quiet testID="copy-request" onPress={() => Clipboard.setStringAsync(request.code)} />
          <Button label="Share it" quiet testID="share-request" onPress={() => Share.share({ message: requestLink(request.code) })} />
          {paid ? <Body testID="paid">{paid}</Body> : <Body>Waiting for it to be paid. You can leave this screen open.</Body>}
        </View>
      ) : null}
    </Screen>
  );
}
