/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereBuilder.pure";

import { CreateSphere, CreateSphereVertexData } from "./sphereBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";

VertexData.CreateSphere = CreateSphereVertexData;

Mesh.CreateSphere = (name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        segments: segments,
        diameterX: diameter,
        diameterY: diameter,
        diameterZ: diameter,
        sideOrientation: sideOrientation,
        updatable: updatable,
    };

    return CreateSphere(name, options, scene);
};
