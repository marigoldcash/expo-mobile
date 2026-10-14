import { codeFromLink, holdCode, isWalletLink, requestLink, takePendingCode } from '../links';

describe('the links the wallet opens', () => {
  it('are the codes themselves, handed over whole', () => {
    expect(codeFromLink('marigoldreq:abc123')).toBe('marigoldreq:abc123');
    expect(codeFromLink('marigoldpay:abc123')).toBe('marigoldpay:abc123');
    expect(codeFromLink('marigoldpay2:abc123')).toBe('marigoldpay2:abc123');
    expect(codeFromLink('marigoldnote:abc123')).toBe('marigoldnote:abc123');
    expect(codeFromLink('  marigoldreq:abc123  ')).toBe('marigoldreq:abc123');
  });

  it('lose the // that some apps put after a scheme', () => {
    expect(codeFromLink('marigoldreq://abc123')).toBe('marigoldreq:abc123');
  });

  it('leave a bare code, as an older QR holds it, as it is', () => {
    expect(codeFromLink('4cf3b95ca5003ab2792f')).toBe('4cf3b95ca5003ab2792f');
  });

  it('are nothing when there is nothing in them', () => {
    expect(codeFromLink('')).toBeNull();
    expect(codeFromLink(null)).toBeNull();
    expect(codeFromLink('marigoldreq:')).toBeNull();
  });

  it('are told from other text, and a request is its own link', () => {
    expect(isWalletLink('marigoldpay:abc')).toBe(true);
    expect(isWalletLink('marigoldpay2:abc')).toBe(true);
    expect(isWalletLink('marigoldreceipt:abc')).toBe(false);
    expect(isWalletLink('https://example.com')).toBe(false);
    expect(requestLink('marigoldreq:abc')).toBe('marigoldreq:abc');
  });

  it('wait for a wallet to be opened, once', () => {
    expect(takePendingCode()).toBeNull();
    holdCode('abc');
    expect(takePendingCode()).toBe('abc');
    expect(takePendingCode()).toBeNull();
  });
});
