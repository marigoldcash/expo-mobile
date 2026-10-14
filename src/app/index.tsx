import { StyleSheet, Text, View } from 'react-native';

import MarigoldCore from '../../modules/marigold-core';

/** The first screen: the name, and the version of the Rust core, which proves the core is in the app. */
export default function Start() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.name}>
        Marigold
      </Text>
      <Text testID="core-version" style={styles.version}>
        Core {MarigoldCore.version()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { fontSize: 32, fontWeight: '600' },
  version: { fontSize: 16, color: '#555555' },
});
