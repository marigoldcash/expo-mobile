import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Pay from '../app/(wallet)/pay';

jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(async () => ''), setStringAsync: jest.fn() }));
jest.mock('../lib/core', () => ({
  core: { payPreview: jest.fn(), pay: jest.fn(), receive: jest.fn() },
  wordsFor: (error: unknown) => (error as Error).message,
}));
const mockCore = jest.requireMock('../lib/core').core as { payPreview: jest.Mock; pay: jest.Mock; receive: jest.Mock };

beforeEach(() => jest.clearAllMocks());

describe('the Pay screen', () => {
  it('shows what a request asks before anything is paid, and pays it when told to', async () => {
    mockCore.payPreview.mockReturnValue({ kind: 'request', amount: '2' });
    mockCore.pay.mockResolvedValue({ receipt: 'marigoldpaid:abc', value: '2', fee: '0.001', notes: 1 });
    render(<Pay />);
    fireEvent.changeText(screen.getByTestId('code'), 'marigoldreq:abc');
    expect(screen.getByTestId('preview')).toHaveTextContent('A request for 2.');
    expect(mockCore.pay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('confirm-pay'));
    await waitFor(() => expect(screen.getByTestId('paid')).toHaveTextContent('Paid 2, and 0.001 to the network. marigoldpaid:abc'));
    expect(mockCore.pay).toHaveBeenCalledWith('marigoldreq:abc', '');
  });

  it('asks for the amount when the request pins none', () => {
    mockCore.payPreview.mockReturnValue({ kind: 'request', amount: '' });
    render(<Pay />);
    fireEvent.changeText(screen.getByTestId('code'), 'marigoldreq:abc');
    expect(screen.getByTestId('pay-amount')).toBeTruthy();
  });

  it('offers to take notes that were handed over, and says when a code is not known', async () => {
    mockCore.payPreview.mockReturnValue({ kind: 'handover', amount: '' });
    mockCore.receive.mockResolvedValue('Took 3.');
    render(<Pay />);
    fireEvent.changeText(screen.getByTestId('code'), 'marigoldnote:abc');
    fireEvent.press(screen.getByTestId('confirm-take'));
    await waitFor(() => expect(screen.getByTestId('taken')).toHaveTextContent('Took 3.'));

    mockCore.payPreview.mockReturnValue({ kind: 'unknown', amount: '' });
    fireEvent.changeText(screen.getByTestId('code'), 'rubbish');
    expect(screen.getByTestId('preview')).toHaveTextContent(/not a code the wallet knows/);
  });

  it('shows the words of an error and no payment', async () => {
    mockCore.payPreview.mockReturnValue({ kind: 'request', amount: '2' });
    mockCore.pay.mockRejectedValue(new Error('You do not have enough notes for that.'));
    render(<Pay />);
    fireEvent.changeText(screen.getByTestId('code'), 'marigoldreq:abc');
    fireEvent.press(screen.getByTestId('confirm-pay'));
    await waitFor(() => expect(screen.getByTestId('problem')).toHaveTextContent('You do not have enough notes for that.'));
    expect(screen.queryByTestId('paid')).toBeNull();
  });
});
