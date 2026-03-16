export * from "./engine.readTexture.types";

import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { Nullable } from "../../../types";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _registered = false;

/**
 * Register side effects for engine.readTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerWebGPUEngineReadTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
        throw "_readTexturePixelsSync is unsupported in WebGPU!";
    };
}
