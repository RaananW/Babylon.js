/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusKnotBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusKnotBuilder.pure";

import { CreateTorusKnot } from "./torusKnotBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";


VertexData.CreateTorusKnot = CreateTorusKnotVertexData;


Mesh.CreateTorusKnot = (
    name: string,
    radius: number,
    tube: number,
    radialSegments: number,
    tubularSegments: number,
    p: number,
    q: number,
    scene?: Scene,
    updatable?: boolean,
    sideOrientation?: number
): Mesh => {
    const options = {
        radius,
        tube,
        radialSegments,
        tubularSegments,
        p,
        q,
        sideOrientation,
        updatable,
    };

    return CreateTorusKnot(name, options, scene);
};
