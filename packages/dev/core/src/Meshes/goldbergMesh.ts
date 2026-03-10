/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import goldbergMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./goldbergMesh.pure";

import { GoldbergMesh } from "./goldbergMesh.pure";
import type { Scene } from "../scene";
import { Mesh } from "../Meshes/mesh";

Mesh._GoldbergMeshParser = (parsedMesh: any, scene: Scene): GoldbergMesh => {
    return GoldbergMesh.Parse(parsedMesh, scene);
};
