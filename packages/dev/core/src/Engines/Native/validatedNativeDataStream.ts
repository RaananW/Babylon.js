/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import validatedNativeDataStream.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./validatedNativeDataStream.pure";

import { ValidatedNativeDataStream } from "./validatedNativeDataStream.pure";
import { NativeDataStream } from "./nativeDataStream";
import { ThinNativeEngine } from "../thinNativeEngine";
import type { INative } from "./nativeInterfaces";

declare const _native: INative;

ThinNativeEngine._createNativeDataStream = function () {
    if (_native.NativeDataStream.VALIDATION_ENABLED) {
        return new ValidatedNativeDataStream();
    } else {
        return new NativeDataStream();
    }
};
