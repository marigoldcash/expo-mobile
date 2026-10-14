import type { ReactNode, Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

// The few plain pieces every screen is made of. No styling pass yet (PH-M11): readable sizes, large touch targets, labels
// that say what a field is, and an accessibility role on everything that is pressed.

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

export function Body({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Text style={styles.body} testID={testID}>
      {children}
    </Text>
  );
}

export function Problem({ children }: { children: string }) {
  if (!children) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={styles.problem} testID="problem">
      {children}
    </Text>
  );
}

export function Button({ label, onPress, testID, disabled, quiet }: { label: string; onPress: () => void; testID?: string; disabled?: boolean; quiet?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.button, quiet && styles.quiet, disabled && styles.disabled]} testID={testID}>
      <Text style={[styles.buttonText, quiet && styles.quietText]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, testID, inputRef, ...input }: { label: string; testID: string; inputRef?: Ref<TextInput> } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} testID={`${testID}-label`}>
        {label}
      </Text>
      <TextInput ref={inputRef} accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} style={styles.input} testID={testID} {...input} />
    </View>
  );
}

/** A PIN field: hidden, and not offered a strong password by the phone. */
export function PinField({ label, testID, ...input }: { label: string; testID: string } & TextInputProps) {
  return <Field label={label} testID={testID} secureTextEntry textContentType="oneTimeCode" autoComplete="off" {...input} />;
}

const styles = StyleSheet.create({
  screen: { padding: 24, gap: 12, backgroundColor: '#ffffff', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '600', color: '#111111' },
  body: { fontSize: 16, color: '#333333', lineHeight: 22 },
  problem: { fontSize: 16, color: '#a00000' },
  field: { gap: 4 },
  label: { fontSize: 16, color: '#333333' },
  input: { borderWidth: 1, borderColor: '#999999', borderRadius: 8, padding: 12, fontSize: 18, color: '#111111' },
  button: { backgroundColor: '#1d3a5f', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 18 },
  quiet: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#1d3a5f' },
  quietText: { color: '#1d3a5f' },
  disabled: { opacity: 0.5 },
});
