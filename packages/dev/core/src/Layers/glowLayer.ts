/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import glowLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayer.pure";

import { Scene } from "../scene";
import { RegisterClass } from "../Misc/typeStore";
import type { Nullable } from "../types";


Scene.prototype.getGlowLayerByName = function (name: string): Nullable<GlowLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === GlowLayer.EffectName) {
            return (<any>this.effectLayers[index]) as GlowLayer;
        }
    }

    return null;
};


RegisterClass("BABYLON.GlowLayer", GlowLayer);
