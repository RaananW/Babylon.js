/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.readTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.readTexture.pure";

import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

// eslint-disable-next-line @typescript-eslint/promise-function-async
ThinWebGPUEngine.prototype._readTexturePixels = function (
    texture: InternalTexture,
    width: number,
    height: number,
    faceIndex = -1,
    level = 0,
    buffer: Nullable<ArrayBufferView> = null,
    flushRenderer = true,
    noDataConversion = false,
    x = 0,
    y = 0
): Promise<ArrayBufferView> {
    const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (flushRenderer) {
        this.flushFramebuffer();
    }

    return this._textureHelper.readPixels(gpuTextureWrapper.underlyingResource!, x, y, width, height, gpuTextureWrapper.format, faceIndex, level, buffer, noDataConversion);
};

ThinWebGPUEngine.prototype._readTexturePixelsSync = function (): ArrayBufferView {
    // eslint-disable-next-line no-throw-literal
    throw "_readTexturePixelsSync is unsupported in WebGPU!";
};
