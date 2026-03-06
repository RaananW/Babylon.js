/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import polygonBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./polygonBuilder.pure";

import { CreatePolygon, ExtrudePolygon } from "./polygonBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import type { Vector3 } from "../../Maths/math.vector";


VertexData.CreatePolygon = CreatePolygonVertexData;

Mesh.CreatePolygon = (name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number, earcutInjection = earcut): Mesh => {
    const options = {
        shape: shape,
        holes: holes,
        updatable: updatable,
        sideOrientation: sideOrientation,
    };
    return CreatePolygon(name, options, scene, earcutInjection);
};


Mesh.ExtrudePolygon = (
    name: string,
    shape: Vector3[],
    depth: number,
    scene: Scene,
    holes?: Vector3[][],
    updatable?: boolean,
    sideOrientation?: number,
    earcutInjection = earcut
): Mesh => {
    const options = {
        shape: shape,
        holes: holes,
        depth: depth,
        updatable: updatable,
        sideOrientation: sideOrientation,
    };
    return ExtrudePolygon(name, options, scene, earcutInjection);
};
