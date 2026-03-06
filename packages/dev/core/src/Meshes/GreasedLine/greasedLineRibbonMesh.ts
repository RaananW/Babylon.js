/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineRibbonMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineRibbonMesh.pure";

import { Mesh } from "../mesh";
import type { Scene } from "../../scene";


Mesh._GreasedLineRibbonMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineRibbonMesh.Parse(parsedMesh, scene);
};
