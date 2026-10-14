import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { Body, Button, Field, PinField, Problem, Screen, Title } from '../../components/ui';
import { core, MIN_PIN, wordsFor } from '../../lib/core';
import { forgetPin } from '../../lib/secrets';
import { openWallet, setOpenWallet } from '../../lib/session';
import { advancedOn, nodeChoice, nodeChoiceLooksRight, setAdvanced, setNodeChoice } from '../../lib/settings';

/** Where the wallet connects, its PIN, the advanced switch, and closing the wallet. */
export default function Settings() {
  const [node, setNode] = useState('');
  const [advanced, setAdvancedState] = useState(false);
  const [nodeNote, setNodeNote] = useState('');
  const [nodeProblem, setNodeProblem] = useState('');
  const [saved, setSaved] = useState('');
  const [old, setOld] = useState('');
  const [fresh, setFresh] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState('');

  useEffect(() => {
    nodeChoice().then((choice) => setNode(choice === 'public' ? '' : choice));
    advancedOn().then(setAdvancedState);
  }, []);

  async function saveNode() {
    setNodeProblem('');
    setNodeNote('');
    if (!nodeChoiceLooksRight(node)) {
      setNodeProblem('That is not an address of a node. It looks like ws://192.168.1.20:17210. Leave it empty to use a public computer.');
      return;
    }
    await setNodeChoice(node);
    setNodeNote('Saved. It is used the next time you open the wallet.');
  }

  async function changePin() {
    setProblem('');
    setSaved('');
    if (fresh !== again) {
      setProblem('The two new PINs are not the same.');
      return;
    }
    try {
      await core.changePassword(old, fresh, advanced);
      // The phone's kept copy of the old PIN is no longer the PIN.
      await forgetPin(openWallet());
      setOld('');
      setFresh('');
      setAgain('');
      setSaved('Your PIN is changed. Face ID or your fingerprint can be turned on again by making the wallet open once with the new PIN.');
    } catch (error) {
      setProblem(wordsFor(error));
    }
  }

  async function close() {
    await core.closeWallet();
    setOpenWallet('');
    router.replace('/');
  }

  return (
    <Screen inTabs>
      <Title>Settings</Title>
      <Field label="Your own node (leave empty for a public computer)" testID="node" value={node} onChangeText={setNode} placeholder="ws://192.168.1.20:17210" />
      <Button label="Save" quiet testID="save-node" onPress={saveNode} />
      {nodeNote ? <Body testID="node-saved">{nodeNote}</Body> : null}
      <Problem testID="node-problem">{nodeProblem}</Problem>
      <Title>Change your PIN</Title>
      <PinField label="The PIN now" testID="pin-old" value={old} onChangeText={setOld} />
      <PinField label={`The new PIN, at least ${MIN_PIN} characters`} testID="pin-new" value={fresh} onChangeText={setFresh} />
      <PinField label="The new PIN once more" testID="pin-new-again" value={again} onChangeText={setAgain} />
      {saved ? <Body testID="saved">{saved}</Body> : null}
      <Problem>{problem}</Problem>
      <Button label="Change my PIN" testID="change-pin" onPress={changePin} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Body>Advanced: allow a wallet without a PIN</Body>
        <Switch
          testID="advanced"
          value={advanced}
          onValueChange={async (on) => {
            setAdvancedState(on);
            await setAdvanced(on);
          }}
        />
      </View>
      <Button label="Close the wallet" quiet testID="close-wallet" onPress={close} />
    </Screen>
  );
}
