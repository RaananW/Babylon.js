/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import decalBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./decalBuilder.pure";

import { CreateDecal } from "./decalBuilder.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import type { AbstractMesh } from "../abstractMesh";


Mesh.CreateDecal = (name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number): Mesh => {
    const options = {
        position,
        normal,
        size,
        angle,
    };

    return CreateDecal(name, sourceMesh, options);
};
