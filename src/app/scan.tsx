import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Screen, Title } from '../components/ui';
import { codeFromLink } from '../lib/links';

/** Reads a payment code from the camera: the QR a request shows, or a link. The code goes to the Pay screen. */
export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);

  if (!permission) return <Screen><Body>Starting the camera…</Body></Screen>;
  if (!permission.granted) {
    return (
      <Screen>
        <Title>Scan a code</Title>
        <Body>To read a code, Marigold needs to use the camera. It is used for nothing else, and nothing it sees leaves the phone.</Body>
        {permission.canAskAgain ? (
          <Button label="Allow the camera" testID="allow-camera" onPress={requestPermission} />
        ) : (
          <Body>The camera is turned off for Marigold. You can turn it on in your phone's settings, or paste the code instead.</Body>
        )}
        <Button label="Paste the code instead" quiet testID="scan-cancel" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <View style={styles.full}>
      <CameraView
        style={styles.full}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          const code = codeFromLink(data);
          if (!code || done.current) return;
          done.current = true;
          router.replace({ pathname: '/pay', params: { code } });
        }}
      />
      <View style={styles.bar}>
        <Button label="Cancel" quiet testID="scan-cancel" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  bar: { position: 'absolute', bottom: 48, left: 24, right: 24 },
});
