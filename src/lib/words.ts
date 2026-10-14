// The two words asked back after the 24 are shown once, so that the paper is known to be right before the wallet is used.

/** Two different places among 24, chosen at random, in order. `random` is injectable for tests. */
export function pickTwo(count: number, random: () => number = Math.random): [number, number] {
  const first = Math.floor(random() * count);
  let second = Math.floor(random() * (count - 1));
  if (second >= first) second += 1;
  return first < second ? [first, second] : [second, first];
}

/** Whether what was typed is the word at that place (1-based in the screen, 0-based here), ignoring case and spaces. */
export function wordMatches(words: string, place: number, typed: string): boolean {
  const list = words.trim().split(/\s+/);
  return (list[place] ?? '').toLowerCase() === typed.trim().toLowerCase() && typed.trim() !== '';
}
