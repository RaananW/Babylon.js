/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcess.pure";

import { Effect } from "../Materials/effect";
import { RegisterClass } from "../Misc/typeStore";
import { AbstractEngine } from "../Engines/abstractEngine";
import type { Nullable } from "../types";


AbstractEngine.prototype.setTextureFromPostProcess = function (channel: number, postProcess: Nullable<PostProcess>, name: string): void {
    let postProcessInput = null;
    if (postProcess) {
        if (postProcess._forcedOutputTexture) {
            postProcessInput = postProcess._forcedOutputTexture;
        } else if (postProcess._textures.data[postProcess._currentRenderTextureInd]) {
            postProcessInput = postProcess._textures.data[postProcess._currentRenderTextureInd];
        }
    }

    this._bindTexture(channel, postProcessInput?.texture ?? null, name);
};


AbstractEngine.prototype.setTextureFromPostProcessOutput = function (channel: number, postProcess: Nullable<PostProcess>, name: string): void {
    this._bindTexture(channel, postProcess?._outputTexture?.texture ?? null, name);
};


/**
 * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
 * @param channel Name of the sampler variable.
 * @param postProcess Post process to get the input texture from.
 */
Effect.prototype.setTextureFromPostProcess = function (channel: string, postProcess: Nullable<PostProcess>): void {
    this._engine.setTextureFromPostProcess(this._samplers[channel], postProcess, channel);
};


/**
 * (Warning! setTextureFromPostProcessOutput may be desired instead)
 * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
 * @param channel Name of the sampler variable.
 * @param postProcess Post process to get the output texture from.
 */
Effect.prototype.setTextureFromPostProcessOutput = function (channel: string, postProcess: Nullable<PostProcess>): void {
    this._engine.setTextureFromPostProcessOutput(this._samplers[channel], postProcess, channel);
};


RegisterClass("BABYLON.PostProcess", PostProcess);
