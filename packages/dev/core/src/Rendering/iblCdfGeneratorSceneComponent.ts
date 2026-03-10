/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblCdfGeneratorSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblCdfGeneratorSceneComponent.pure";

import { IblCdfGeneratorSceneComponent } from "./iblCdfGeneratorSceneComponent.pure";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { IblCdfGenerator } from "./iblCdfGenerator";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal (Backing field) */
        _iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Gets or Sets the current CDF generator associated to the scene.
         * The CDF (cumulative distribution function) generator creates CDF maps
         * for a given IBL texture that can then be used for more efficient
         * importance sampling.
         */
        iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Enables a IblCdfGenerator and associates it with the scene.
         * @returns the IblCdfGenerator
         */
        enableIblCdfGenerator(): Nullable<IblCdfGenerator>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableIblCdfGenerator(): void;
    }
}

Object.defineProperty(Scene.prototype, "iblCdfGenerator", {
    get: function (this: Scene) {
        return this._iblCdfGenerator;
    },
    set: function (this: Scene, value: Nullable<IblCdfGenerator>) {
        if (value) {
            this._iblCdfGenerator = value;
        }
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.enableIblCdfGenerator = function (): Nullable<IblCdfGenerator> {
    if (this._iblCdfGenerator) {
        return this._iblCdfGenerator;
    }

    this._iblCdfGenerator = new IblCdfGenerator(this);
    if (!this._iblCdfGenerator.isSupported) {
        this._iblCdfGenerator = null;
        return null;
    }
    if (this.environmentTexture) {
        this._iblCdfGenerator.iblSource = this.environmentTexture;
    }
    return this._iblCdfGenerator;
};

Scene.prototype.disableIblCdfGenerator = function (): void {
    if (!this._iblCdfGenerator) {
        return;
    }

    this._iblCdfGenerator.dispose();
    this._iblCdfGenerator = null;
};

IblCdfGenerator._SceneComponentInitialization = (scene: Scene) => {
    // Register the CDF generator component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_IBLCDFGENERATOR) as IblCdfGeneratorSceneComponent;
    if (!component) {
        component = new IblCdfGeneratorSceneComponent(scene);
        scene._addComponent(component);
    }
};
