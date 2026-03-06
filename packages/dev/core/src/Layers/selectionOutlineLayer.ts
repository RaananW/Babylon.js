/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import selectionOutlineLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./selectionOutlineLayer.pure";

import { SelectionOutlineLayer } from "./selectionOutlineLayer.pure";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { RegisterClass } from "../Misc/typeStore";

Scene.prototype.getSelectionOutlineLayerByName = function (name: string): Nullable<SelectionOutlineLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === SelectionOutlineLayer.EffectName) {
            return (<any>this.effectLayers[index]) as SelectionOutlineLayer;
        }
    }

    return null;
};

RegisterClass("BABYLON.SelectionOutlineLayer", SelectionOutlineLayer);
