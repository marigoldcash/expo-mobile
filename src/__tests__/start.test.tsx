import { render, screen } from '@testing-library/react-native';

import Start from '../app/index';

describe('the first screen', () => {
  it('says the name of the wallet', () => {
    render(<Start />);
    expect(screen.getByRole('header')).toHaveTextContent('Marigold');
  });
});
