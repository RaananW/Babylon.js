/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxBuilder.pure";

import { CreateBox, CreateBoxVertexData } from "./boxBuilder.pure";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";

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
