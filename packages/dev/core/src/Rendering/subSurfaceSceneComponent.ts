/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subSurfaceSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceSceneComponent.pure";

import { SubSurfaceSceneComponent } from "./subSurfaceSceneComponent.pure";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { SubSurfaceConfiguration } from "./subSurfaceConfiguration";
import { Color3 } from "../Maths/math.color";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";

// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_SUBSURFACE, (parsedData: any, scene: Scene) => {
    // Diffusion profiles
    if (parsedData.ssDiffusionProfileColors !== undefined && parsedData.ssDiffusionProfileColors !== null) {
        scene.enableSubSurfaceForPrePass();
        if (scene.subSurfaceConfiguration) {
            for (let index = 0, cache = parsedData.ssDiffusionProfileColors.length; index < cache; index++) {
                const color = parsedData.ssDiffusionProfileColors[index];
                scene.subSurfaceConfiguration.addDiffusionProfile(new Color3(color.r, color.g, color.b));
            }
        }
    }
});

Object.defineProperty(Scene.prototype, "subSurfaceConfiguration", {
    get: function (this: Scene) {
        return this._subSurfaceConfiguration;
    },
    set: function (this: Scene, value: Nullable<SubSurfaceConfiguration>) {
        if (value) {
            if (this.enablePrePassRenderer()) {
                this._subSurfaceConfiguration = value;
            }
        }
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.enableSubSurfaceForPrePass = function (): Nullable<SubSurfaceConfiguration> {
    if (this._subSurfaceConfiguration) {
        return this._subSurfaceConfiguration;
    }

    const prePassRenderer = this.enablePrePassRenderer();
    if (prePassRenderer) {
        this._subSurfaceConfiguration = new SubSurfaceConfiguration(this);
        prePassRenderer.addEffectConfiguration(this._subSurfaceConfiguration);
        return this._subSurfaceConfiguration;
    }

    return null;
};

Scene.prototype.disableSubSurfaceForPrePass = function (): void {
    if (!this._subSurfaceConfiguration) {
        return;
    }

    this._subSurfaceConfiguration.dispose();
    this._subSurfaceConfiguration = null;
};

SubSurfaceConfiguration._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_SUBSURFACE) as SubSurfaceSceneComponent;
    if (!component) {
        component = new SubSurfaceSceneComponent(scene);
        scene._addComponent(component);
    }
};
