/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import discBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discBuilder.pure";

import { CreateDisc } from "./discBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";


VertexData.CreateDisc = CreateDiscVertexData;


Mesh.CreateDisc = (name: string, radius: number, tessellation: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        radius,
        tessellation,
        sideOrientation,
        updatable,
    };

    return CreateDisc(name, options, scene);
};
