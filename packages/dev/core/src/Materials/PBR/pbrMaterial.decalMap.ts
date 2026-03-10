/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMaterial.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMaterial.decalMap.pure";

import { DecalMapConfiguration } from "../material.decalMapConfiguration";
import { PBRBaseMaterial } from "./pbrBaseMaterial";
import type { Nullable } from "core/types";

declare module "./pbrBaseMaterial" {
    /**
     *
     */
    export interface PBRBaseMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}

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
