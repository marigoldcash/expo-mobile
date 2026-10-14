// Which wallet is open, for the screens that need its name. The core holds the wallet itself; this is only the name.
let open = '';

export const setOpenWallet = (name: string) => {
  open = name;
};
export const openWallet = () => open;
