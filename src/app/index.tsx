import { StyleSheet, Text, View } from 'react-native';

/** The first screen. PH-M4c replaces the line under the name with the version the Rust core reports. */
export default function Start() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.name}>
        Marigold
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 32, fontWeight: '600' },
});
