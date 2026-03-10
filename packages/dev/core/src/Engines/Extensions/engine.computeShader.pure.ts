/** This file must only contain pure code and pure imports */

/**
 * Type used to locate a resource in a compute shader.
 * TODO: remove this when browsers support reflection for wgsl shaders
 */
export type ComputeBindingLocation = { group: number; binding: number };

/**
 * Type used to lookup a resource and retrieve its binding location
 * TODO: remove this when browsers support reflection for wgsl shaders
 */
export type ComputeBindingMapping = { [key: string]: ComputeBindingLocation };

/**
 * Types of messages that can be generated during compilation
 */
export type ComputeCompilationMessageType = "error" | "warning" | "info";

/**
 * Messages generated during compilation
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ComputeCompilationMessages {
    /**
     * Number of errors generated during compilation
     */
    numErrors: number;
    /**
     * List of messages generated during compilation
     */
    messages: {
        type: ComputeCompilationMessageType;
        text: string;
        line?: number;
        column?: number;
        length?: number;
        offset?: number;
    }[];
}

/** @internal */
export const enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
    TextureWithoutSampler = 4,
    Sampler = 5,
    ExternalTexture = 6,
    DataBuffer = 7,
    InternalTexture = 8,
}

/** @internal */
export type ComputeBindingList = { [key: string]: { type: ComputeBindingType; object: any; indexInGroupEntries?: number } };
