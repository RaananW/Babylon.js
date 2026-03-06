/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.decalMap.pure";

import { DecalMapConfiguration } from "./material.decalMapConfiguration";
import { StandardMaterial } from "./standardMaterial";


Object.defineProperty(StandardMaterial.prototype, "decalMap", {
    get: function (this: StandardMaterial) {
        if (!this._decalMap) {
            this._decalMap = new DecalMapConfiguration(this);
        }
        return this._decalMap;
    },
    enumerable: true,
    configurable: true,
});
