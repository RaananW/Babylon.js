/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxBuilder.pure";

import { CreateBox } from "./boxBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";


// Side effects
VertexData.CreateBox = CreateBoxVertexData;


Mesh.CreateBox = (name: string, size: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        size,
        sideOrientation,
        updatable,
    };

    return CreateBox(name, options, scene);
};
