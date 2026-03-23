export * from "./engine.renderTargetTexture.types";

import type { Nullable } from "../../../types";
import type { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _registered = false;

/**
 * Register side effects for engine.renderTargetTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerWebGPUEngineRenderTargetTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
