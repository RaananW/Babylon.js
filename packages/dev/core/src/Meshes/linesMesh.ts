/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesMesh.pure";

import { Mesh } from "../Meshes/mesh";
import type { Scene } from "../scene";


Mesh._LinesMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return LinesMesh.Parse(parsedMesh, scene);
};
