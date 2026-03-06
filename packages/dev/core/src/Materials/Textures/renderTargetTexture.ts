/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./renderTargetTexture.pure";

import { Texture } from "../../Materials/Textures/texture";
import { Effect } from "../effect";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";


/**
 * Sets a depth stencil texture from a render target on the engine to be used in the shader.
 * @param channel Name of the sampler variable.
 * @param texture Texture to set.
 */
Effect.prototype.setDepthStencilTexture = function (channel: string, texture: Nullable<RenderTargetTexture>): void {
    this._engine.setDepthStencilTexture(this._samplers[channel], this._uniforms[channel], texture, channel);
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars
Texture._CreateRenderTargetTexture = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean, creationFlags?: number) => {
    return new RenderTargetTexture(name, renderTargetSize, scene, generateMipMaps);
};
