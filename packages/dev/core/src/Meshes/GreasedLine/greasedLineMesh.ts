/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineMesh.pure";

import { GreasedLineMesh } from "./greasedLineMesh.pure";
import type { Scene } from "../../scene";
import { Mesh } from "../mesh";

Mesh._GreasedLineMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineMesh.Parse(parsedMesh, scene);
};
