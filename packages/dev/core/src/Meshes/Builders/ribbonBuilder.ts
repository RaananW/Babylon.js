/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ribbonBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ribbonBuilder.pure";

import { CreateRibbon } from "./ribbonBuilder.pure";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import type { Vector3 } from "../../Maths/math.vector";


VertexData.CreateRibbon = CreateRibbonVertexData;


Mesh.CreateRibbon = (
    name: string,
    pathArray: Vector3[][],
    closeArray: boolean = false,
    closePath: boolean,
    offset: number,
    scene?: Scene,
    updatable: boolean = false,
    sideOrientation?: number,
    instance?: Mesh
) => {
    return CreateRibbon(
        name,
        {
            pathArray: pathArray,
            closeArray: closeArray,
            closePath: closePath,
            offset: offset,
            updatable: updatable,
            sideOrientation: sideOrientation,
            instance: instance,
        },
        scene
    );
};
