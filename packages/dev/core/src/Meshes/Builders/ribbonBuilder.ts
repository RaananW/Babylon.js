/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ribbonBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ribbonBuilder.pure";

import { CreateRibbon, CreateRibbonVertexData } from "./ribbonBuilder.pure";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";

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
