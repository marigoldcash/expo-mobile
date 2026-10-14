import { codeFromLink, holdCode, isWalletLink, requestLink, takePendingCode } from '../links';

describe('the links the wallet opens', () => {
  it('give the code inside them', () => {
    expect(codeFromLink('marigoldreq:abc123')).toBe('abc123');
    expect(codeFromLink('marigoldpay:abc123')).toBe('abc123');
    expect(codeFromLink('MarigoldReq://abc123')).toBe('abc123');
    expect(codeFromLink('  marigoldreq: abc123  ')).toBe('abc123');
  });

  it('leave a bare code, as a QR holds it, as it is', () => {
    expect(codeFromLink('4cf3b95ca5003ab2792f')).toBe('4cf3b95ca5003ab2792f');
  });

  it('are nothing when there is nothing in them', () => {
    expect(codeFromLink('')).toBeNull();
    expect(codeFromLink(null)).toBeNull();
    expect(codeFromLink('marigoldreq:')).toBeNull();
  });

  it('are told from other text, and a request makes one', () => {
    expect(isWalletLink('marigoldpay:abc')).toBe(true);
    expect(isWalletLink('https://example.com')).toBe(false);
    expect(requestLink('abc')).toBe('marigoldreq:abc');
    expect(codeFromLink(requestLink('abc'))).toBe('abc');
  });

  it('wait for a wallet to be opened, once', () => {
    expect(takePendingCode()).toBeNull();
    holdCode('abc');
    expect(takePendingCode()).toBe('abc');
    expect(takePendingCode()).toBeNull();
  });
});
