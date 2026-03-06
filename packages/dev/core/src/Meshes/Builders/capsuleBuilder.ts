/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import capsuleBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./capsuleBuilder.pure";

import { CreateCapsule, CreateCapsuleVertexData, ICreateCapsuleOptions } from "./capsuleBuilder.pure";
import { VertexData } from "../mesh.vertexData";
import { Mesh } from "../mesh";
import { Nullable } from "../../types";
import { Scene } from "../../scene";

/**
 * Creates a capsule or a pill mesh
 * @param name defines the name of the mesh.
 * @param options the constructors options used to shape the mesh.
 * @param scene defines the scene the mesh is scoped to.
 * @returns the capsule mesh
 * @see https://doc.babylonjs.com/how_to/capsule_shape
 */
Mesh.CreateCapsule = (name: string, options: ICreateCapsuleOptions, scene?: Nullable<Scene>): Mesh => {
    return CreateCapsule(name, options, scene);
};

VertexData.CreateCapsule = CreateCapsuleVertexData;
