/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lensFlareSystemSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lensFlareSystemSceneComponent.pure";

import { LensFlareSystemSceneComponent } from "./lensFlareSystemSceneComponent.pure";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { AssetContainer } from "../assetContainer";
import { LensFlareSystem } from "./lensFlareSystem";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Removes the given lens flare system from this scene.
         * @param toRemove The lens flare system to remove
         * @returns The index of the removed lens flare system
         */
        removeLensFlareSystem(toRemove: LensFlareSystem): number;

        /**
         * Adds the given lens flare system to this scene
         * @param newLensFlareSystem The lens flare system to add
         */
        addLensFlareSystem(newLensFlareSystem: LensFlareSystem): void;

        /**
         * Gets a lens flare system using its name
         * @param name defines the name to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemByName(name: string): Nullable<LensFlareSystem>;

        /**
         * Gets a lens flare system using its Id
         * @param id defines the Id to look for
         * @returns the lens flare system or null if not found
         * @deprecated Please use getLensFlareSystemById instead
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        getLensFlareSystemByID(id: string): Nullable<LensFlareSystem>;

        /**
         * Gets a lens flare system using its Id
         * @param id defines the Id to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemById(id: string): Nullable<LensFlareSystem>;
    }
}

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
