/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import planeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./planeBuilder.pure";

import { CreatePlane, CreatePlaneVertexData } from "./planeBuilder.pure";
import type { Scene } from "../../scene";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreatePlane = CreatePlaneVertexData;

Mesh.CreatePlane = (name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        size,
        width: size,
        height: size,
        sideOrientation,
        updatable,
    };

    return CreatePlane(name, options, scene);
};
