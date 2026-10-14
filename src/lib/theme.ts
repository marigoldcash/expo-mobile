import { useColorScheme } from 'react-native';

// Two sets of colours, the light and the dark, and the phone's own setting chooses between them. Each text colour keeps a contrast
// of at least 4.5 to 1 against the background it is used on (WCAG AA).

export interface Theme {
  background: string;
  text: string;
  quietText: string;
  border: string;
  panel: string;
  button: string;
  buttonText: string;
  problem: string;
}

export const light: Theme = {
  background: '#ffffff',
  text: '#111111',
  quietText: '#4d4d4d',
  border: '#8a8a8a',
  panel: '#f1f1f1',
  button: '#1d3a5f',
  buttonText: '#ffffff',
  problem: '#a00000',
};

export const dark: Theme = {
  background: '#101418',
  text: '#f2f2f2',
  quietText: '#b8bec6',
  border: '#7b8490',
  panel: '#1d232a',
  button: '#7fb0ee',
  buttonText: '#0b1520',
  problem: '#ff8a8a',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Contrast ratio of two #rrggbb colours, for the test that holds the palettes to it. */
export function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const channel = (i: number) => {
      const v = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
