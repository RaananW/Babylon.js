/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorSceneComponent.pure";

import { ShadowGeneratorSceneComponent } from "./shadowGeneratorSceneComponent.pure";
import type { Scene } from "../../scene";
import { SceneComponentConstants } from "../../sceneComponent";
import { ShadowGenerator } from "./shadowGenerator";
import { CascadedShadowGenerator } from "./cascadedShadowGenerator";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";

// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_SHADOWGENERATOR, (parsedData: any, scene: Scene) => {
    // Shadows
    if (parsedData.shadowGenerators !== undefined && parsedData.shadowGenerators !== null) {
        for (let index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
            const parsedShadowGenerator = parsedData.shadowGenerators[index];
            if (parsedShadowGenerator.className === CascadedShadowGenerator.CLASSNAME) {
                CascadedShadowGenerator.Parse(parsedShadowGenerator, scene);
            } else {
                ShadowGenerator.Parse(parsedShadowGenerator, scene);
            }
            // SG would be available on their associated lights
        }
    }
});

ShadowGenerator._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_SHADOWGENERATOR);
    if (!component) {
        component = new ShadowGeneratorSceneComponent(scene);
        scene._addComponent(component);
    }
};
