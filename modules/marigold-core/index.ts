import native from './src/MarigoldCoreModule';
import { createCore } from './src/core';

export { WalletError, createCore } from './src/core';
export type { Core, Subscription, WalletErrorCode } from './src/core';
export type * from './src/types';

/** The wallet core, ready to use. */
const core = createCore(native);
export default core;
