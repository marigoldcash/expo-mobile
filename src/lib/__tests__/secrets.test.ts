import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { biometricsAvailable, forgetPin, pinIsKept, recallPin, rememberPin } from '../secrets';

jest.mock('expo-secure-store', () => {
  const items = new Map<string, string>();
  return {
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'passcode',
    setItemAsync: jest.fn(async (key: string, value: string) => void items.set(key, value)),
    getItemAsync: jest.fn(async (key: string) => items.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => void items.delete(key)),
    __items: items,
  };
});
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn() }));

const store = SecureStore as unknown as { __items: Map<string, string> } & typeof SecureStore;

beforeEach(() => {
  store.__items.clear();
  jest.clearAllMocks();
});

describe('the phone offers its own check', () => {
  it('only when there is the hardware and a face or finger is enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    expect(await biometricsAvailable()).toBe(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    expect(await biometricsAvailable()).toBe(false);
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('no'));
    expect(await biometricsAvailable()).toBe(false);
  });
});

describe('a kept PIN', () => {
  it("is kept behind the phone's check, and a marker says so without asking for it", async () => {
    expect(await pinIsKept('ph')).toBe(false);
    expect(await rememberPin('ph', '1234')).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pin.ph', '1234', expect.objectContaining({ requireAuthentication: true }));
    expect(await pinIsKept('ph')).toBe(true);
    expect(await recallPin('ph')).toBe('1234');
    expect(SecureStore.getItemAsync).toHaveBeenLastCalledWith('pin.ph', expect.objectContaining({ requireAuthentication: true }));
  });

  it('is typed instead when the phone cannot keep it, or the check is cancelled', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('no biometrics'));
    expect(await rememberPin('ph', '1234')).toBe(false);
    expect(await pinIsKept('ph')).toBe(false);
    await rememberPin('ph', '1234');
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('cancelled'));
    expect(await recallPin('ph')).toBeNull();
  });

  it('is forgotten with its marker', async () => {
    await rememberPin('ph', '1234');
    await forgetPin('ph');
    expect(await pinIsKept('ph')).toBe(false);
    expect(await recallPin('ph')).toBeNull();
  });

  it("is kept under a name that cannot reach another wallet's", async () => {
    await rememberPin('../other wallet', '1234');
    expect([...store.__items.keys()].every((key) => /^[A-Za-z0-9._-]+$/.test(key))).toBe(true);
  });
});
