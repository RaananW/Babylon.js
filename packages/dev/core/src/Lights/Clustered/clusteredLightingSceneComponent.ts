/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clusteredLightingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clusteredLightingSceneComponent.pure";

import { ClusteredLightingSceneComponent } from "./clusteredLightingSceneComponent.pure";
import { SceneComponentConstants } from "core/sceneComponent";
import { ClusteredLightContainer } from "./clusteredLightContainer";

ClusteredLightContainer._SceneComponentInitialization = (scene) => {
    if (!scene._getComponent(SceneComponentConstants.NAME_CLUSTEREDLIGHTING)) {
        scene._addComponent(new ClusteredLightingSceneComponent(scene));
    }
};
