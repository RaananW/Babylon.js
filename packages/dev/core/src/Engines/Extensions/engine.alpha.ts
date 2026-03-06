/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.alpha.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.alpha.pure";

import { ThinEngine } from "../../Engines/thinEngine";
import { Constants } from "../constants";


ThinEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false, targetIndex: number = 0): void {
    if (this._alphaMode[targetIndex] === mode) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === Constants.ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.depthCullingState.depthMask = depthMask;
            }
        }
        return;
    }

    const alphaBlendDisabled = mode === Constants.ALPHA_DISABLE;

    this._alphaState.setAlphaBlend(!alphaBlendDisabled, targetIndex);
    this._alphaState.setAlphaMode(mode, targetIndex);

    if (!noDepthWriteChange) {
        this.depthCullingState.depthMask = alphaBlendDisabled;
    }
    this._alphaMode[targetIndex] = mode;
};
