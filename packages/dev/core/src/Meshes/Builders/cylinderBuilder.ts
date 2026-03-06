/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cylinderBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderBuilder.pure";

import { CreateCylinder, CreateCylinderVertexData } from "./cylinderBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Scene } from "../../scene";

VertexData.CreateCylinder = CreateCylinderVertexData;

Mesh.CreateCylinder = (
    name: string,
    height: number,
    diameterTop: number,
    diameterBottom: number,
    tessellation: number,
    subdivisions: any,
    scene?: Scene,
    updatable?: any,
    sideOrientation?: number
): Mesh => {
    if (scene === undefined || !(scene instanceof Scene)) {
        if (scene !== undefined) {
            sideOrientation = updatable || Mesh.DEFAULTSIDE;
            updatable = scene;
        }
        scene = <Scene>subdivisions;
        subdivisions = 1;
    }

    const options = {
        height,
        diameterTop,
        diameterBottom,
        tessellation,
        subdivisions,
        sideOrientation,
        updatable,
    };

    return CreateCylinder(name, options, scene);
};
