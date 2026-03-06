/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesBuilder.pure";

import { CreateDashedLines, CreateLineSystem, CreateLines } from "./linesBuilder.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { LinesMesh } from "../../Meshes/linesMesh";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";


VertexData.CreateLineSystem = CreateLineSystemVertexData;

VertexData.CreateDashedLines = CreateDashedLinesVertexData;


Mesh.CreateLines = (name: string, points: Vector3[], scene: Nullable<Scene> = null, updatable: boolean = false, instance: Nullable<LinesMesh> = null): LinesMesh => {
    const options = {
        points,
        updatable,
        instance,
    };
    return CreateLines(name, options, scene);
};


Mesh.CreateDashedLines = (
    name: string,
    points: Vector3[],
    dashSize: number,
    gapSize: number,
    dashNb: number,
    scene: Nullable<Scene> = null,
    updatable?: boolean,
    instance?: LinesMesh
): LinesMesh => {
    const options = {
        points,
        dashSize,
        gapSize,
        dashNb,
        updatable,
        instance,
    };
    return CreateDashedLines(name, options, scene);
};
