/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import groundMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./groundMesh.pure";

import { Mesh } from "../Meshes/mesh";
import type { Scene } from "../scene";


Mesh._GroundMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GroundMesh.Parse(parsedMesh, scene);
};
