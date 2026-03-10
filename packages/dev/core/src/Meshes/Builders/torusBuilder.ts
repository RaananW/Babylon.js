/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBuilder.pure";

import { CreateTorus, CreateTorusVertexData } from "./torusBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";

VertexData.CreateTorus = CreateTorusVertexData;

Mesh.CreateTorus = (name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        diameter,
        thickness,
        tessellation,
        sideOrientation,
        updatable,
    };

    return CreateTorus(name, options, scene);
};
