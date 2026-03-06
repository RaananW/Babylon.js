/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import groundBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./groundBuilder.pure";

import {
    CreateGround,
    CreateGroundFromHeightMap,
    CreateGroundFromHeightMapVertexData,
    CreateGroundVertexData,
    CreateTiledGround,
    CreateTiledGroundVertexData,
} from "./groundBuilder.pure";
import { Scene } from "../../scene";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { GroundMesh } from "../groundMesh";

VertexData.CreateGround = CreateGroundVertexData;

VertexData.CreateTiledGround = CreateTiledGroundVertexData;

VertexData.CreateGroundFromHeightMap = CreateGroundFromHeightMapVertexData;

Mesh.CreateGround = (name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean): Mesh => {
    const options = {
        width,
        height,
        subdivisions,
        updatable,
    };

    return CreateGround(name, options, scene);
};

Mesh.CreateTiledGround = (
    name: string,
    xmin: number,
    zmin: number,
    xmax: number,
    zmax: number,
    subdivisions: { w: number; h: number },
    precision: { w: number; h: number },
    scene: Scene,
    updatable?: boolean
): Mesh => {
    const options = {
        xmin,
        zmin,
        xmax,
        zmax,
        subdivisions,
        precision,
        updatable,
    };

    return CreateTiledGround(name, options, scene);
};

Mesh.CreateGroundFromHeightMap = (
    name: string,
    url: string,
    width: number,
    height: number,
    subdivisions: number,
    minHeight: number,
    maxHeight: number,
    scene: Scene,
    updatable?: boolean,
    onReady?: (mesh: GroundMesh) => void,
    alphaFilter?: number
): GroundMesh => {
    const options = {
        width,
        height,
        subdivisions,
        minHeight,
        maxHeight,
        updatable,
        onReady,
        alphaFilter,
    };

    return CreateGroundFromHeightMap(name, url, options, scene);
};
