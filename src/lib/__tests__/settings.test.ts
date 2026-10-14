import { nodeChoiceLooksRight } from '../settings';

describe('the address of a node', () => {
  it('is empty, public, or a ws:// or wss:// address', () => {
    for (const ok of ['', ' ', 'public', 'ws://192.168.1.20:17210', 'wss://rpc1.marigold.cash', 'ws://localhost:17210/']) {
      expect(nodeChoiceLooksRight(ok)).toBe(true);
    }
  });

  it('is nothing else', () => {
    for (const bad of ['http://x', 'rpc1.marigold.cash', 'ws://', 'ws://a b', 'grpc://127.0.0.1:16210', 'local']) {
      expect(nodeChoiceLooksRight(bad)).toBe(false);
    }
  });
});
