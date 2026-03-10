/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hemisphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hemisphereBuilder.pure";

import { CreateHemisphere } from "./hemisphereBuilder.pure";
import { Mesh } from "../mesh";
import type { Scene } from "../../scene";

/**
 * Creates a hemispheric light
 * @param name
 * @param segments
 * @param diameter
 * @param scene
 * @returns the mesh
 */
Mesh.CreateHemisphere = (name: string, segments: number, diameter: number, scene?: Scene): Mesh => {
    const options = {
        segments: segments,
        diameter: diameter,
    };

    return CreateHemisphere(name, options, scene);
};
