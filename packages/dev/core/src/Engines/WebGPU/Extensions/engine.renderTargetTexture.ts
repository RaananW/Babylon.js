/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTargetTexture.pure";

import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import type { Nullable } from "../../../types";
import type { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";


ThinWebGPUEngine.prototype.setDepthStencilTexture = function (
    channel: number,
    uniform: Nullable<WebGLUniformLocation>,
    texture: Nullable<RenderTargetTexture>,
    name?: string
): void {
    if (!texture || !texture.depthStencilTexture) {
        this._setTexture(channel, null, undefined, undefined, name);
    } else {
        this._setTexture(channel, texture, false, true, name);
    }
};
