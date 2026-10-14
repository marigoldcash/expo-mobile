import { render, screen } from '@testing-library/react-native';

import Start from '../app/index';

// The native side is the Rust core, which a unit test does not have: the module answers as the phone's would.
jest.mock('../../modules/marigold-core', () => ({
  __esModule: true,
  default: {
    version: () => '9.9.9',
    configure: () => ({ folder: '/wallets', network: 'testnet-10' }),
    listWallets: async () => [{ filename: 'ph', title: 'ph' }],
  },
}));
// Navigation needs a container the test does not build: a link is its child, and focus is the screen being shown.
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    require('react').useEffect(effect, [effect]);
  },
}));

describe('the first screen', () => {
  it('says the name of the wallet', () => {
    render(<Start />);
    expect(screen.getByRole('header')).toHaveTextContent('Marigold');
  });

  it('shows the version the core reports', () => {
    render(<Start />);
    expect(screen.getByTestId('core-version')).toHaveTextContent('Core 9.9.9');
  });

  it('lists the wallets on the phone and offers a new one', async () => {
    render(<Start />);
    expect(await screen.findByTestId('wallet-ph')).toBeTruthy();
    expect(screen.getByTestId('create-wallet')).toBeTruthy();
  });
});
