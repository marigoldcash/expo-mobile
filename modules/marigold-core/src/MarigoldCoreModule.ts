import { NativeModule, requireNativeModule } from 'expo';

/** The native side. PH-M4e puts typed functions for every operation of the core in front of it. */
declare class MarigoldCoreModule extends NativeModule<{}> {
  /** The version of the Rust core. */
  version(): string;
}

export default requireNativeModule<MarigoldCoreModule>('MarigoldCore');
