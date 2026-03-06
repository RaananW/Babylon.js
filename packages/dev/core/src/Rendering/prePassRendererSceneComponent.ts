/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassRendererSceneComponent.pure";

import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { PrePassRenderer } from "./prePassRenderer";
import { Logger } from "../Misc/logger";
import type { Nullable } from "../types";


Object.defineProperty(Scene.prototype, "prePassRenderer", {
    get: function (this: Scene) {
        return this._prePassRenderer;
    },
    set: function (this: Scene, value: Nullable<PrePassRenderer>) {
        if (value && value.isSupported) {
            this._prePassRenderer = value;
        }
    },
    enumerable: true,
    configurable: true,
});


Scene.prototype.enablePrePassRenderer = function (): Nullable<PrePassRenderer> {
    if (this._prePassRenderer) {
        return this._prePassRenderer;
    }

    this._prePassRenderer = new PrePassRenderer(this);

    if (!this._prePassRenderer.isSupported) {
        this._prePassRenderer = null;
        Logger.Error("PrePassRenderer needs WebGL 2 support.\n" + "Maybe you tried to use the following features that need the PrePassRenderer :\n" + " + Subsurface Scattering");
    }

    return this._prePassRenderer;
};


Scene.prototype.disablePrePassRenderer = function (): void {
    if (!this._prePassRenderer) {
        return;
    }

    this._prePassRenderer.dispose();
    this._prePassRenderer = null;
};


PrePassRenderer._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_PREPASSRENDERER) as PrePassRendererSceneComponent;
    if (!component) {
        component = new PrePassRendererSceneComponent(scene);
        scene._addComponent(component);
    }
};
