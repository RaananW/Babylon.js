/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeEngine.pure";

import { NativeEngine } from "./nativeEngine.pure";
import { ThinNativeEngine } from "./thinNativeEngine";

function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            if (name !== "constructor") {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}


// Apply the ThinNativeEngine mixins to the NativeEngine.
applyMixins(NativeEngine, [ThinNativeEngine]);
