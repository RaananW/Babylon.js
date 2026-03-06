/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tubeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tubeBuilder.pure";

import { CreateTube } from "./tubeBuilder.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import type { Scene } from "../../scene";


Mesh.CreateTube = (
    name: string,
    path: Vector3[],
    radius: number,
    tessellation: number,
    radiusFunction: { (i: number, distance: number): number },
    cap: number,
    scene: Scene,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        path: path,
        radius: radius,
        tessellation: tessellation,
        radiusFunction: radiusFunction,
        arc: 1,
        cap: cap,
        updatable: updatable,
        sideOrientation: sideOrientation,
        instance: instance,
    };
    return CreateTube(name, options, scene);
};
