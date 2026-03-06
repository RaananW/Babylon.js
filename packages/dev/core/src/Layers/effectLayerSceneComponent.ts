/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import effectLayerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./effectLayerSceneComponent.pure";

import { EffectLayerSceneComponent } from "./effectLayerSceneComponent.pure";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { AssetContainer } from "../assetContainer";
import { EffectLayer } from "./effectLayer";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";

// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_EFFECTLAYER, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    if (parsedData.effectLayers) {
        if (!container.effectLayers) {
            container.effectLayers = [] as EffectLayer[];
        }

        for (let index = 0; index < parsedData.effectLayers.length; index++) {
            const effectLayer = EffectLayer.Parse(parsedData.effectLayers[index], scene, rootUrl);
            container.effectLayers.push(effectLayer);
        }
    }
});

EffectLayer._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_EFFECTLAYER) as EffectLayerSceneComponent;
    if (!component) {
        component = new EffectLayerSceneComponent(scene);
        scene._addComponent(component);
    }
};
