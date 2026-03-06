/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineMesh.pure";

import { Mesh } from "../mesh";
import type { Scene } from "../../scene";


Mesh._GreasedLineMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineMesh.Parse(parsedMesh, scene);
};
