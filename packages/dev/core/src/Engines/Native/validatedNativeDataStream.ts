/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import validatedNativeDataStream.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./validatedNativeDataStream.pure";

import { ThinNativeEngine } from "../thinNativeEngine";
import { NativeDataStream } from "./nativeDataStream";


ThinNativeEngine._createNativeDataStream = function () {
    if (_native.NativeDataStream.VALIDATION_ENABLED) {
        return new ValidatedNativeDataStream();
    } else {
        return new NativeDataStream();
    }
};
