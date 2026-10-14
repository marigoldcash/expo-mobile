// Which wallet is open, for the screens that need its name, and the name of its unit. The core holds the wallet itself.
let open = '';
let unit = '';

export const setOpenWallet = (name: string, ticker = '') => {
  open = name;
  unit = ticker;
};
export const openWallet = () => open;
/** The name of the wallet's unit, as the core gave it when the wallet was opened ("" if not known). */
export const openTicker = () => unit;
/** An amount as a person reads it, with the unit after it. */
export const withUnit = (amount: string) => (unit ? `${amount} ${unit}` : amount);
