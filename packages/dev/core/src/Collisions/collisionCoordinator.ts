/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import collisionCoordinator.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./collisionCoordinator.pure";

import { Scene } from "../scene";


Scene.CollisionCoordinatorFactory = () => {
    return new DefaultCollisionCoordinator();
};
