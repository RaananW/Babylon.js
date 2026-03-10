/** This file must only contain pure code and pure imports */

import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { Engine } from "./engine.pure";
import type { ThinNativeEngineOptions } from "./thinNativeEngine.pure";
import type { ThinNativeEngine } from "./thinNativeEngine.pure";

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Options to create the Native engine
 */
export interface NativeEngineOptions extends ThinNativeEngineOptions {}

/** @internal */
export class NativeEngine extends Engine {
    /**
     * @internal
     * Will be overriden by the Thin Native engine implementation
     * No code should be placed here
     */
    protected _initializeNativeEngine(_adaptToDeviceRatio: boolean): void {}

    /**
     * @internal
     */
    public constructor(options: NativeEngineOptions = {}) {
        super(null, false, undefined, options.adaptToDeviceRatio);

        this._initializeNativeEngine(options.adaptToDeviceRatio ?? false);
    }

    /**
     * @internal
     */
    public override wrapWebGLTexture(): InternalTexture {
        throw new Error("wrapWebGLTexture is not supported, use wrapNativeTexture instead.");
    }

    /**
     * @internal
     */
    public override _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, _faceIndex: number = 0, _lod: number = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }
}

/**
 * @internal
 * Augments the NativeEngine type to include ThinNativeEngine methods and preventing dupplicate TS errors
 */
export interface NativeEngine extends Omit<ThinNativeEngine, keyof Engine> {}

/**
 * @internal
 * Applies the functionality of one or more base constructors to a derived constructor.
 */
