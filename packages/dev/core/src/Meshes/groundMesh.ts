/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import groundMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./groundMesh.pure";

import { GroundMesh } from "./groundMesh.pure";
import { Scene } from "../scene";
import { Mesh } from "../Meshes/mesh";

Mesh._GroundMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GroundMesh.Parse(parsedMesh, scene);
};
