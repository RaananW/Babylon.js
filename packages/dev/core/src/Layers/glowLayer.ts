/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import glowLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayer.pure";

import { GlowLayer } from "./glowLayer.pure";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import { RegisterClass } from "../Misc/typeStore";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * Return the first glow layer of the scene with a given name.
         * @param name The name of the glow layer to look for.
         * @returns The glow layer if found otherwise null.
         */
        getGlowLayerByName(name: string): Nullable<GlowLayer>;
    }
}

Scene.prototype.getGlowLayerByName = function (name: string): Nullable<GlowLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === GlowLayer.EffectName) {
            return (<any>this.effectLayers[index]) as GlowLayer;
        }
    }

    return null;
};

RegisterClass("BABYLON.GlowLayer", GlowLayer);
