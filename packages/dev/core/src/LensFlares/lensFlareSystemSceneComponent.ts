/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lensFlareSystemSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lensFlareSystemSceneComponent.pure";

import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { LensFlareSystem } from "./lensFlareSystem";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";
import type { Nullable } from "../types";
import type { AssetContainer } from "../assetContainer";


// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_LENSFLARESYSTEM, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    // Lens flares
    if (parsedData.lensFlareSystems !== undefined && parsedData.lensFlareSystems !== null) {
        if (!container.lensFlareSystems) {
            container.lensFlareSystems = [] as LensFlareSystem[];
        }

        for (let index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
            const parsedLensFlareSystem = parsedData.lensFlareSystems[index];
            const lf = LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
            container.lensFlareSystems.push(lf);
        }
    }
});


Scene.prototype.getLensFlareSystemByName = function (name: string): Nullable<LensFlareSystem> {
    for (let index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].name === name) {
            return this.lensFlareSystems[index];
        }
    }

    return null;
};


Scene.prototype.getLensFlareSystemById = function (id: string): Nullable<LensFlareSystem> {
    for (let index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].id === id) {
            return this.lensFlareSystems[index];
        }
    }

    return null;
};


Scene.prototype.getLensFlareSystemByID = function (id: string): Nullable<LensFlareSystem> {
    return this.getLensFlareSystemById(id);
};


Scene.prototype.removeLensFlareSystem = function (toRemove: LensFlareSystem): number {
    const index = this.lensFlareSystems.indexOf(toRemove);
    if (index !== -1) {
        this.lensFlareSystems.splice(index, 1);
    }
    return index;
};


Scene.prototype.addLensFlareSystem = function (newLensFlareSystem: LensFlareSystem): void {
    this.lensFlareSystems.push(newLensFlareSystem);
};


LensFlareSystem._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_LENSFLARESYSTEM) as LensFlareSystemSceneComponent;
    if (!component) {
        component = new LensFlareSystemSceneComponent(scene);
        scene._addComponent(component);
    }
};
