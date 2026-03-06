/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.texture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.texture.pure";

import { DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { AbstractEngine } from "../abstractEngine";

AbstractEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    if (options.isCube) {
        const width = (<{ width: number; height: number }>size).width || <number>size;
        return this._createDepthStencilCubeTexture(width, options);
    } else {
        return this._createDepthStencilTexture(size, options, rtWrapper);
    }
};
