/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import trailMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./trailMesh.pure";

import { TrailMesh } from "./trailMesh.pure";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

Mesh._TrailMeshParser = (parsedMesh: any, scene: Scene) => {
    return TrailMesh.Parse(parsedMesh, scene);
};
