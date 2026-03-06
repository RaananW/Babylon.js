/** This file must only contain pure code and pure imports */

import type { Nullable } from "../../types";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { Scene } from "../../scene";
import { Constants } from "../constants";
import { ThinEngine } from "../thinEngine";
import type { IWebRequest } from "../../Misc/interfaces/iWebRequest";


declare module "../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         */
        updateRawTexture(
            texture: Nullable<InternalTexture>,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            type: number,
            useSRGBBuffer: boolean
        ): void;
        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param level defines which level of the texture to update
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>, level: number): void;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(
            url: string,
            scene: Nullable<Scene>,
            size: number,
            format: number,
            type: number,
            noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[] | Promise<ArrayBufferView[]>>,
            mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>
        ): InternalTexture;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param invertY defines if data must be stored with Y axis inverted
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(
            url: string,
            scene: Nullable<Scene>,
            size: number,
            format: number,
            type: number,
            noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[] | Promise<ArrayBufferView[]>>,
            mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            samplingMode: number,
            invertY: boolean
        ): InternalTexture;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture2DArray(
            texture: InternalTexture,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            textureType: number
        ): void;
    }
}

/**
 * @internal
 */

/**
 * Create a function for createRawTexture3D/createRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function MakeCreateRawTextureFunction(is3D: boolean) {
    return function (
        this: ThinEngine,
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ): InternalTexture {
        const target = is3D ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY;
        const source = is3D ? InternalTextureSource.Raw3D : InternalTextureSource.Raw2DArray;
        const texture = new InternalTexture(this, source);
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        if (is3D) {
            texture.is3D = true;
        } else {
            texture.is2DArray = true;
        }

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        if (is3D) {
            this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);
        } else {
            this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);
        }
        this._bindTextureDirectly(target, texture, true);

        // Filters
        const filters = this._getSamplingParameters(samplingMode, generateMipMaps);

        this._gl.texParameteri(target, this._gl.TEXTURE_MAG_FILTER, filters.mag);
        this._gl.texParameteri(target, this._gl.TEXTURE_MIN_FILTER, filters.min);

        if (generateMipMaps) {
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(target, null);

        this._internalTexturesCache.push(texture);

        return texture;
    };
}

/**
 * Create a function for updateRawTexture3D/updateRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @internal
 */
function MakeUpdateRawTextureFunction(is3D: boolean) {
    return function (
        this: ThinEngine,
        texture: InternalTexture,
        data: Nullable<ArrayBufferView>,
        format: number,
        invertY: boolean,
        compression: Nullable<string> = null,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ): void {
        const target = is3D ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY;
        const internalType = this._getWebGLTextureType(textureType);
        const internalFormat = this._getInternalFormat(format);
        const internalSizedFomat = this._getRGBABufferInternalSizedFormat(textureType, format);

        this._bindTextureDirectly(target, texture, true);
        this._unpackFlipY(invertY === undefined ? true : invertY ? true : false);

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
            texture.format = format;
            texture.invertY = invertY;
            texture._compression = compression;
        }

        if (texture.width % 4 !== 0) {
            this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
        }

        if (compression && data) {
            this._gl.compressedTexImage3D(target, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, texture.depth, 0, data);
        } else {
            this._gl.texImage3D(target, 0, internalSizedFomat, texture.width, texture.height, texture.depth, 0, internalFormat, internalType, data);
        }

        if (texture.generateMipMaps) {
            this._gl.generateMipmap(target);
        }
        this._bindTextureDirectly(target, null);
        // this.resetTextureCache();
        texture.isReady = true;
    };
}
