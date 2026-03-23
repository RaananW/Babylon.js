export * from "./pbrMaterial.decalMap.types";

import { DecalMapConfiguration } from "../material.decalMapConfiguration";
import { PBRBaseMaterial } from "./pbrBaseMaterial";

let _registered = false;

/**
 * Register side effects for pbrMaterial.decalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerPbrMaterialDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Object.defineProperty(PBRBaseMaterial.prototype, "decalMap", {
        get: function (this: PBRBaseMaterial) {
            if (!this._decalMap) {
                this._decalMap = new DecalMapConfiguration(this);
            }
            return this._decalMap;
        },
        enumerable: true,
        configurable: true,
    });
}
