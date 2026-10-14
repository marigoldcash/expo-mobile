import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// A wallet's PIN, kept in the Keychain (iOS) or the Keystore (Android) behind the phone's own check — Face ID, a
// fingerprint, the device passcode — so that the PIN need not be typed each time. Reading it asks the phone to check the
// person; if the check is cancelled, fails, or the phone's biometrics have changed since, the PIN is simply typed.

const secretKey = (wallet: string) => `pin.${wallet.replace(/[^A-Za-z0-9._-]/g, '_')}`;
const markerKey = (wallet: string) => `pin-kept.${wallet.replace(/[^A-Za-z0-9._-]/g, '_')}`;

/** Whether this phone can check the person at all: it has the hardware and something is enrolled. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Keeps the PIN behind the phone's check. Returns false when it could not be kept (the PIN is then always typed). */
export async function rememberPin(wallet: string, pin: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(secretKey(wallet), pin, {
      requireAuthentication: true,
      authenticationPrompt: 'Open your wallet',
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(markerKey(wallet), '1');
    return true;
  } catch {
    await forgetPin(wallet);
    return false;
  }
}

/** Whether a PIN was kept for this wallet. Asks nothing of the person. */
export async function pinIsKept(wallet: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(markerKey(wallet))) === '1';
  } catch {
    return false;
  }
}

/** The kept PIN, after the phone has checked the person; null if they cancelled or the check failed. */
export async function recallPin(wallet: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(secretKey(wallet), {
      requireAuthentication: true,
      authenticationPrompt: 'Open your wallet',
    });
  } catch {
    return null;
  }
}

export async function forgetPin(wallet: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(secretKey(wallet));
    await SecureStore.deleteItemAsync(markerKey(wallet));
  } catch {
    // Nothing was kept, or it is already gone.
  }
}
