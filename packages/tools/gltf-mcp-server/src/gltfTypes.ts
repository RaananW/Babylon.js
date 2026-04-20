/**
 * Minimal glTF 2.0 type definitions for the in-memory document model.
 * These mirror the glTF 2.0 specification structures needed by the manager.
 */

/* ------------------------------------------------------------------ */
/*  glTF top-level types                                              */
/* ------------------------------------------------------------------ */

/**
 *
 */
export interface IGltfAsset {
    /**
     *
     */
    version: string;
    /**
     *
     */
    generator?: string;
    /**
     *
     */
    copyright?: string;
    /**
     *
     */
    minVersion?: string;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfScene {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    nodes?: number[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfNode {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    children?: number[];
    /**
     *
     */
    mesh?: number;
    /**
     *
     */
    skin?: number;
    /**
     *
     */
    camera?: number;
    /**
     *
     */
    translation?: [number, number, number];
    /**
     *
     */
    rotation?: [number, number, number, number];
    /**
     *
     */
    scale?: [number, number, number];
    /**
     *
     */
    matrix?: number[];
    /**
     *
     */
    weights?: number[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfPrimitive {
    /**
     *
     */
    attributes: Record<string, number>;
    /**
     *
     */
    indices?: number;
    /**
     *
     */
    material?: number;
    /**
     *
     */
    mode?: number;
    /**
     *
     */
    targets?: Record<string, number>[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfMesh {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    primitives: IGltfPrimitive[];
    /**
     *
     */
    weights?: number[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfTextureInfo {
    /**
     *
     */
    index: number;
    /**
     *
     */
    texCoord?: number;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfNormalTextureInfo extends IGltfTextureInfo {
    /**
     *
     */
    scale?: number;
}

/**
 *
 */
export interface IGltfOcclusionTextureInfo extends IGltfTextureInfo {
    /**
     *
     */
    strength?: number;
}

/**
 *
 */
export interface IGltfPbrMetallicRoughness {
    /**
     *
     */
    baseColorFactor?: [number, number, number, number];
    /**
     *
     */
    baseColorTexture?: IGltfTextureInfo;
    /**
     *
     */
    metallicFactor?: number;
    /**
     *
     */
    roughnessFactor?: number;
    /**
     *
     */
    metallicRoughnessTexture?: IGltfTextureInfo;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfMaterial {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    pbrMetallicRoughness?: IGltfPbrMetallicRoughness;
    /**
     *
     */
    normalTexture?: IGltfNormalTextureInfo;
    /**
     *
     */
    occlusionTexture?: IGltfOcclusionTextureInfo;
    /**
     *
     */
    emissiveTexture?: IGltfTextureInfo;
    /**
     *
     */
    emissiveFactor?: [number, number, number];
    /**
     *
     */
    alphaMode?: "OPAQUE" | "MASK" | "BLEND";
    /**
     *
     */
    alphaCutoff?: number;
    /**
     *
     */
    doubleSided?: boolean;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfTexture {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    sampler?: number;
    /**
     *
     */
    source?: number;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfImage {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    uri?: string;
    /**
     *
     */
    mimeType?: string;
    /**
     *
     */
    bufferView?: number;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfSampler {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    magFilter?: number;
    /**
     *
     */
    minFilter?: number;
    /**
     *
     */
    wrapS?: number;
    /**
     *
     */
    wrapT?: number;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfAccessor {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    bufferView?: number;
    /**
     *
     */
    byteOffset?: number;
    /**
     *
     */
    componentType: number;
    /**
     *
     */
    normalized?: boolean;
    /**
     *
     */
    count: number;
    /**
     *
     */
    type: string;
    /**
     *
     */
    max?: number[];
    /**
     *
     */
    min?: number[];
    /**
     *
     */
    sparse?: unknown;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfBufferView {
    /**
     *
     */
    buffer: number;
    /**
     *
     */
    byteOffset?: number;
    /**
     *
     */
    byteLength: number;
    /**
     *
     */
    byteStride?: number;
    /**
     *
     */
    target?: number;
    /**
     *
     */
    name?: string;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfBuffer {
    /**
     *
     */
    uri?: string;
    /**
     *
     */
    byteLength: number;
    /**
     *
     */
    name?: string;
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfAnimationChannelTarget {
    /**
     *
     */
    node?: number;
    /**
     *
     */
    path: string;
}

/**
 *
 */
export interface IGltfAnimationChannel {
    /**
     *
     */
    sampler: number;
    /**
     *
     */
    target: IGltfAnimationChannelTarget;
}

/**
 *
 */
export interface IGltfAnimationSampler {
    /**
     *
     */
    input: number;
    /**
     *
     */
    interpolation?: string;
    /**
     *
     */
    output: number;
}

/**
 *
 */
export interface IGltfAnimation {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    channels: IGltfAnimationChannel[];
    /**
     *
     */
    samplers: IGltfAnimationSampler[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfSkin {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    inverseBindMatrices?: number;
    /**
     *
     */
    skeleton?: number;
    /**
     *
     */
    joints: number[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/**
 *
 */
export interface IGltfCamera {
    /**
     *
     */
    name?: string;
    /**
     *
     */
    type: string;
    /**
     *
     */
    orthographic?: {
        /**
         *
         */
        xmag: number;
        /**
         *
         */
        ymag: number;
        /**
         *
         */
        zfar: number;
        /**
         *
         */
        znear: number;
    };
    /**
     *
     */
    perspective?: {
        /**
         *
         */
        aspectRatio?: number;
        /**
         *
         */
        yfov: number;
        /**
         *
         */
        zfar?: number;
        /**
         *
         */
        znear: number;
    };
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/* ------------------------------------------------------------------ */
/*  Top-level glTF document                                            */
/* ------------------------------------------------------------------ */

/**
 *
 */
export interface IGltfDocument {
    /**
     *
     */
    asset: IGltfAsset;
    /**
     *
     */
    scene?: number;
    /**
     *
     */
    scenes?: IGltfScene[];
    /**
     *
     */
    nodes?: IGltfNode[];
    /**
     *
     */
    meshes?: IGltfMesh[];
    /**
     *
     */
    materials?: IGltfMaterial[];
    /**
     *
     */
    textures?: IGltfTexture[];
    /**
     *
     */
    images?: IGltfImage[];
    /**
     *
     */
    samplers?: IGltfSampler[];
    /**
     *
     */
    accessors?: IGltfAccessor[];
    /**
     *
     */
    bufferViews?: IGltfBufferView[];
    /**
     *
     */
    buffers?: IGltfBuffer[];
    /**
     *
     */
    animations?: IGltfAnimation[];
    /**
     *
     */
    skins?: IGltfSkin[];
    /**
     *
     */
    cameras?: IGltfCamera[];
    /**
     *
     */
    extensionsUsed?: string[];
    /**
     *
     */
    extensionsRequired?: string[];
    /**
     *
     */
    extensions?: Record<string, unknown>;
    /**
     *
     */
    extras?: unknown;
}

/* ------------------------------------------------------------------ */
/*  Extension target types                                             */
/* ------------------------------------------------------------------ */

export type GltfExtensionTargetType = "root" | "scene" | "node" | "mesh" | "material" | "texture" | "image" | "animation";

/**
 *
 */
export interface IGltfExtensible {
    /**
     *
     */
    extensions?: Record<string, unknown>;
}
