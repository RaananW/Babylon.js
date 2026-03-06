/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import physicsImpostor.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./physicsImpostor.pure";

import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";


Mesh._PhysicsImpostorParser = function (scene: Scene, physicObject: IPhysicsEnabledObject, jsonObject: any): PhysicsImpostor {
    return new PhysicsImpostor(
        physicObject,
        jsonObject.physicsImpostor,
        {
            mass: jsonObject.physicsMass,
            friction: jsonObject.physicsFriction,
            restitution: jsonObject.physicsRestitution,
        },
        scene
    );
};
