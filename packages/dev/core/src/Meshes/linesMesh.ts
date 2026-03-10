/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesMesh.pure";

import { LinesMesh } from "./linesMesh.pure";
import type { Scene } from "../scene";
import { Mesh } from "../Meshes/mesh";

Mesh._LinesMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return LinesMesh.Parse(parsedMesh, scene);
};
