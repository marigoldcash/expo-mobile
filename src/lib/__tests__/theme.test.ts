import { contrast, dark, light } from '../theme';

describe.each([
  ['light', light],
  ['dark', dark],
])('the %s colours', (_name, theme) => {
  it('keep text readable on what it is set on (4.5 to 1)', () => {
    expect(contrast(theme.text, theme.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.quietText, theme.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.text, theme.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.problem, theme.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.buttonText, theme.button)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.button, theme.background)).toBeGreaterThanOrEqual(3);
  });
});
