export * from "./engine.renderTargetTexture.types";

import type { Nullable } from "../../types";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { ThinEngine } from "../../Engines/thinEngine";

let _registered = false;

/**
 * Register side effects for engine.renderTargetTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerExtensionsEngineRenderTargetTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    ThinEngine.prototype.setDepthStencilTexture = function (channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>, name?: string): void {
        if (channel === undefined) {
            return;
        }

        if (uniform) {
            this._boundUniforms[channel] = uniform;
        }

        if (!texture || !texture.depthStencilTexture) {
            this._setTexture(channel, null, undefined, undefined, name);
        } else {
            this._setTexture(channel, texture, false, true, name);
        }
    };
}
