import { render, screen } from '@testing-library/react-native';

import Start from '../app/index';

// The native side is the Rust core, which a unit test does not have: the module answers as the phone's would.
jest.mock('../../modules/marigold-core', () => ({ __esModule: true, default: { version: () => '9.9.9' } }));

describe('the first screen', () => {
  it('says the name of the wallet', () => {
    render(<Start />);
    expect(screen.getByRole('header')).toHaveTextContent('Marigold');
  });

  it('shows the version the core reports', () => {
    render(<Start />);
    expect(screen.getByTestId('core-version')).toHaveTextContent('Core 9.9.9');
  });
});
