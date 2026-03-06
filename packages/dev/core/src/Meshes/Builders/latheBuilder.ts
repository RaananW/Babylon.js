/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import latheBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./latheBuilder.pure";

import { CreateLathe } from "./latheBuilder.pure";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";

Mesh.CreateLathe = (name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        shape: shape,
        radius: radius,
        tessellation: tessellation,
        sideOrientation: sideOrientation,
        updatable: updatable,
    };

    return CreateLathe(name, options, scene);
};
