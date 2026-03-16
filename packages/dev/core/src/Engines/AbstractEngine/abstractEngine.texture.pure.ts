export * from "./abstractEngine.texture.types";

import type { DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { AbstractEngine } from "../abstractEngine";

let _registered = false;

/**
 * Register side effects for abstractEngine.texture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerAbstractEngineTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
        if (options.isCube) {
            const width = (<{ width: number; height: number }>size).width || <number>size;
            return this._createDepthStencilCubeTexture(width, options);
        } else {
            return this._createDepthStencilTexture(size, options, rtWrapper);
        }
    };
}
