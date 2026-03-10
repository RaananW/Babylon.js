/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import highlightLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./highlightLayer.pure";

import { HighlightLayer } from "./highlightLayer.pure";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { RegisterClass } from "../Misc/typeStore";

/* eslint-disable @typescript-eslint/no-unused-vars */

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @returns The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
    }
}

Scene.prototype.getHighlightLayerByName = function (name: string): Nullable<HighlightLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === HighlightLayer.EffectName) {
            return (<any>this.effectLayers[index]) as HighlightLayer;
        }
    }

    return null;
};

RegisterClass("BABYLON.HighlightLayer", HighlightLayer);
