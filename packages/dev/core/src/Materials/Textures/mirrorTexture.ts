/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mirrorTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mirrorTexture.pure";

import { Texture } from "../../Materials/Textures/texture";
import type { Scene } from "../../scene";


Texture._CreateMirror = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean): MirrorTexture => {
    return new MirrorTexture(name, renderTargetSize, scene, generateMipMaps);
};
