/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shapeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shapeBuilder.pure";

import { ExtrudeShape, ExtrudeShapeCustom } from "./shapeBuilder.pure";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";

Mesh.ExtrudeShape = (
    name: string,
    shape: Vector3[],
    path: Vector3[],
    scale: number,
    rotation: number,
    cap: number,
    scene: Nullable<Scene> = null,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        shape: shape,
        path: path,
        scale: scale,
        rotation: rotation,
        cap: cap === 0 ? 0 : cap || Mesh.NO_CAP,
        sideOrientation: sideOrientation,
        instance: instance,
        updatable: updatable,
    };

    return ExtrudeShape(name, options, scene);
};

Mesh.ExtrudeShapeCustom = (
    name: string,
    shape: Vector3[],
    path: Vector3[],
    scaleFunction: Nullable<{ (i: number, distance: number): number }>,
    rotationFunction: Nullable<{ (i: number, distance: number): number }>,
    ribbonCloseArray: boolean,
    ribbonClosePath: boolean,
    cap: number,
    scene: Scene,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        shape: shape,
        path: path,
        scaleFunction: scaleFunction,
        rotationFunction: rotationFunction,
        ribbonCloseArray: ribbonCloseArray,
        ribbonClosePath: ribbonClosePath,
        cap: cap === 0 ? 0 : cap || Mesh.NO_CAP,
        sideOrientation: sideOrientation,
        instance: instance,
        updatable: updatable,
    };

    return ExtrudeShapeCustom(name, options, scene);
};
