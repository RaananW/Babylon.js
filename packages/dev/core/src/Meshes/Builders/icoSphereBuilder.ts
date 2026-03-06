/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import icoSphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./icoSphereBuilder.pure";

import { CreateIcoSphere } from "./icoSphereBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";


VertexData.CreateIcoSphere = CreateIcoSphereVertexData;


Mesh.CreateIcoSphere = (name: string, options: { radius?: number; flat?: boolean; subdivisions?: number; sideOrientation?: number; updatable?: boolean }, scene: Scene): Mesh => {
    return CreateIcoSphere(name, options, scene);
};
