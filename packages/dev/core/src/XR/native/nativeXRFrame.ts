/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeXRFrame.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeXRFrame.pure";

import { NativeXRFrame } from "./nativeXRFrame.pure";
import { RegisterNativeTypeAsync } from "../../Engines/thinNativeEngine";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
RegisterNativeTypeAsync("NativeXRFrame", NativeXRFrame);
