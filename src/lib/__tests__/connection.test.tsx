import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppState } from 'react-native';

import { RETRY_SECONDS, useConnection } from '../connection';

jest.mock('../core', () => ({ core: { connection: jest.fn(), resume: jest.fn(), on: jest.fn() } }));
const mockCore = jest.requireMock('../core').core as { connection: jest.Mock; resume: jest.Mock; on: jest.Mock };

function Probe() {
  const { words } = useConnection();
  return <Text testID="words">{words}</Text>;
}

let appStateListener: (next: string) => void;
let connectionListener: () => void;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockCore.connection.mockResolvedValue({ connected: true, words: 'Using: a public computer, with your own copy of the notes.' });
  mockCore.resume.mockResolvedValue(undefined);
  mockCore.on.mockImplementation((_event: string, listener: () => void) => {
    connectionListener = listener;
    return { remove: jest.fn() };
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (next: string) => void;
    return { remove: jest.fn() } as never;
  });
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
});
afterEach(() => jest.useRealTimers());

describe('the words about the connection', () => {
  it('are read when the screen opens', async () => {
    render(<Probe />);
    expect(await screen.findByText('Using: a public computer, with your own copy of the notes.')).toBeTruthy();
  });

  it('change when the core says the connection went, and try again every few seconds while the app is shown', async () => {
    render(<Probe />);
    await screen.findByText(/Using:/);
    mockCore.connection.mockResolvedValue({ connected: false, words: 'There is no connection to the network right now.' });
    await act(async () => connectionListener());
    expect(await screen.findByText(/no connection/)).toBeTruthy();
    expect(mockCore.resume).not.toHaveBeenCalled();

    mockCore.connection.mockResolvedValue({ connected: true, words: 'Using: a public computer, with your own copy of the notes.' });
    await act(async () => {
      jest.advanceTimersByTime(RETRY_SECONDS * 1000 + 10);
    });
    expect(mockCore.resume).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Using:/)).toBeTruthy();
  });

  it('ask the core to reconnect when the app returns to the foreground', async () => {
    render(<Probe />);
    await screen.findByText(/Using:/);
    await act(async () => appStateListener('active'));
    expect(mockCore.resume).toHaveBeenCalledTimes(1);
  });
});
