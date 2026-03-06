/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import videoTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./videoTexture.pure";

import { VideoTexture, VideoTextureSettings } from "./videoTexture.pure";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import { RegisterClass } from "core/Misc/typeStore";

Texture._CreateVideoTexture = (
    name: Nullable<string>,
    src: string | string[] | HTMLVideoElement,
    scene: Nullable<Scene>,
    generateMipMaps = false,
    invertY = false,
    samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
    settings: Partial<VideoTextureSettings> = {},
    onError?: Nullable<(message?: string, exception?: any) => void>,
    format: number = Constants.TEXTUREFORMAT_RGBA
) => {
    return new VideoTexture(name, src, scene, generateMipMaps, invertY, samplingMode, settings, onError, format);
};

// Some exporters relies on Tools.Instantiate
RegisterClass("BABYLON.VideoTexture", VideoTexture);
