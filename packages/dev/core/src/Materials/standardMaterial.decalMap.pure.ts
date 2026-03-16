export * from "./standardMaterial.decalMap.types";

import { DecalMapConfiguration } from "./material.decalMapConfiguration";
import { StandardMaterial } from "./standardMaterial";

let _registered = false;

/**
 * Register side effects for standardMaterial.decalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerStandardMaterialDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
