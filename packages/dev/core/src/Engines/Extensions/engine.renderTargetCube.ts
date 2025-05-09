import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import { Constants } from "../constants";
import { ThinEngine } from "../thinEngine";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { RenderTargetCreationOptions } from "../../Materials/Textures/textureCreationOptions";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Creates a new render target cube wrapper
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target cube wrapper
         */
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
    }
}

ThinEngine.prototype.createRenderTargetCubeTexture = function (size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size) as WebGLRenderTargetWrapper;

    const fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
        samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
        ...options,
    };
    fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
        // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    } else if (fullOptions.type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
        // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }
    const gl = this._gl;

    const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);

    const filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps);

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        Logger.Warn("Float textures are not supported. Cube render target forced to TEXTURETYPE_UNESIGNED_BYTE type");
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (let face = 0; face < 6; face++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
            0,
            this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format),
            size,
            size,
            0,
            this._getInternalFormat(fullOptions.format),
            this._getWebGLTextureType(fullOptions.type),
            null
        );
    }

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);

    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer, fullOptions.generateDepthBuffer, size, size);

    // MipMaps
    if (fullOptions.generateMipMaps) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    }

    // Unbind
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
    this._bindUnboundFramebuffer(null);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer;

    texture.width = size;
    texture.height = size;
    texture.isReady = true;
    texture.isCube = true;
    texture.samples = 1;
    texture.generateMipMaps = fullOptions.generateMipMaps;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;

    this._internalTexturesCache.push(texture);
    rtWrapper.setTextures(texture);

    return rtWrapper;
};
