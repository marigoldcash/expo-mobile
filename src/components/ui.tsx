import { useMemo, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme, type Theme } from '../lib/theme';

// The few plain pieces every screen is made of. Colours follow the phone's light or dark setting; text grows with the phone's
// text size (up to twice, so a button never breaks); every touch target is at least 48 high; everything pressed has a role.

function useStyles() {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
}

/** `inTabs`: the screen sits above the tab bar, which on iOS floats over the content, so the end of it is scrolled clear. */
export function Screen({ children, inTabs }: { children: ReactNode; inTabs?: boolean }) {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.ground}
      contentContainerStyle={[styles.screen, inTabs && styles.inTabs]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.title} testID="title">
      {children}
    </Text>
  );
}

export function Body({ children, testID }: { children: ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <Text maxFontSizeMultiplier={2} style={styles.body} testID={testID}>
      {children}
    </Text>
  );
}

/** The 24 words, or any text to be copied: large, selectable, on a panel. */
export function WordsBox({ children, testID }: { children: string; testID: string }) {
  const styles = useStyles();
  return (
    <Text selectable maxFontSizeMultiplier={2} style={styles.words} testID={testID}>
      {children}
    </Text>
  );
}

export function Problem({ children, testID = 'problem' }: { children: string; testID?: string }) {
  const styles = useStyles();
  if (!children) return null;
  return (
    <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={styles.problem} testID={testID}>
      {children}
    </Text>
  );
}

export function Button({ label, onPress, testID, disabled, quiet }: { label: string; onPress: () => void; testID?: string; disabled?: boolean; quiet?: boolean }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, quiet && styles.quiet, disabled && styles.disabled]}
      testID={testID}
    >
      <Text maxFontSizeMultiplier={2} style={[styles.buttonText, quiet && styles.quietText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, testID, inputRef, ...input }: { label: string; testID: string; inputRef?: Ref<TextInput> } & TextInputProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text maxFontSizeMultiplier={2} style={styles.label} testID={`${testID}-label`}>
        {label}
      </Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        maxFontSizeMultiplier={2}
        placeholderTextColor={theme.quietText}
        style={styles.input}
        testID={testID}
        {...input}
      />
    </View>
  );
}

/** A PIN field: hidden, and not offered a strong password by the phone. */
export function PinField({ label, testID, ...input }: { label: string; testID: string } & TextInputProps) {
  return <Field label={label} testID={testID} secureTextEntry textContentType="oneTimeCode" autoComplete="off" {...input} />;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    ground: { backgroundColor: t.background },
    screen: { padding: 24, gap: 12, backgroundColor: t.background, flexGrow: 1 },
    inTabs: { paddingBottom: 140 },
    title: { fontSize: 26, fontWeight: '600', color: t.text },
    body: { fontSize: 16, color: t.text, lineHeight: 22 },
    words: { fontSize: 20, lineHeight: 30, backgroundColor: t.panel, color: t.text, padding: 12, borderRadius: 8 },
    problem: { fontSize: 16, color: t.problem },
    field: { gap: 4 },
    label: { fontSize: 16, color: t.text },
    input: { borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 12, fontSize: 18, color: t.text, minHeight: 48 },
    button: { backgroundColor: t.button, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
    buttonText: { color: t.buttonText, fontSize: 18, textAlign: 'center' },
    quiet: { backgroundColor: t.background, borderWidth: 1, borderColor: t.button },
    quietText: { color: t.text },
    disabled: { opacity: 0.5 },
  });
}
