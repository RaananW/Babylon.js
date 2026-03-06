/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLineRibbonMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLineRibbonMesh.pure";

import { GreasedLineRibbonMesh } from "./greasedLineRibbonMesh.pure";
import { Scene } from "../../scene";
import { Mesh } from "../mesh";

Mesh._GreasedLineRibbonMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineRibbonMesh.Parse(parsedMesh, scene);
};
