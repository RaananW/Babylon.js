/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import polyhedronBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./polyhedronBuilder.pure";

import { CreatePolyhedron, CreatePolyhedronVertexData } from "./polyhedronBuilder.pure";
import { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreatePolyhedron = CreatePolyhedronVertexData;

Mesh.CreatePolyhedron = (
    name: string,
    options: {
        type?: number;
        size?: number;
        sizeX?: number;
        sizeY?: number;
        sizeZ?: number;
        custom?: any;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        updatable?: boolean;
        sideOrientation?: number;
    },
    scene: Scene
): Mesh => {
    return CreatePolyhedron(name, options, scene);
};
