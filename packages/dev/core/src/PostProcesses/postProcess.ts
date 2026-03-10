/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcess.pure";

import { PostProcess } from "./postProcess.pure";
import type { Nullable } from "../types";
import { Effect } from "../Materials/effect";
import { AbstractEngine } from "../Engines/abstractEngine";
import { RegisterClass } from "../Misc/typeStore";

declare module "../Engines/abstractEngine" {
    /**
     *
     */
    export interface AbstractEngine {
        /**
         * Sets a texture to the context from a postprocess
         * @param channel defines the channel to use
         * @param postProcess defines the source postprocess
         * @param name name of the channel
         */
        setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>, name: string): void;

        /**
         * Binds the output of the passed in post process to the texture channel specified
         * @param channel The channel the texture should be bound to
         * @param postProcess The post process which's output should be bound
         * @param name name of the channel
         */
        setTextureFromPostProcessOutput(channel: number, postProcess: Nullable<PostProcess>, name: string): void;
    }
}

declare module "../Materials/effect" {
    /**
     *
     */
    export interface Effect {
        /**
         * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
         * @param channel Name of the sampler variable.
         * @param postProcess Post process to get the input texture from.
         */
        setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void;

        /**
         * (Warning! setTextureFromPostProcessOutput may be desired instead)
         * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
         * @param channel Name of the sampler variable.
         * @param postProcess Post process to get the output texture from.
         */
        setTextureFromPostProcessOutput(channel: string, postProcess: Nullable<PostProcess>): void;
    }
}

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
