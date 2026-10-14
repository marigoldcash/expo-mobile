import { pickTwo, wordMatches } from '../words';

describe('the two words asked back', () => {
  it('are two different places among the 24, in order', () => {
    for (let i = 0; i < 200; i++) {
      const [a, b] = pickTwo(24);
      expect(a).toBeLessThan(b);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(24);
    }
    expect(pickTwo(24, () => 0)).toEqual([0, 1]);
    expect(pickTwo(24, () => 0.999)).toEqual([22, 23]);
  });

  it('match the paper whatever the case or the spaces around them, and nothing else', () => {
    const words = 'one two three four';
    expect(wordMatches(words, 2, ' Three ')).toBe(true);
    expect(wordMatches(words, 2, 'four')).toBe(false);
    expect(wordMatches(words, 2, '')).toBe(false);
    expect(wordMatches(words, 9, 'nine')).toBe(false);
  });
});
