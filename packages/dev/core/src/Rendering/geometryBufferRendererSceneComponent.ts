/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryBufferRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryBufferRendererSceneComponent.pure";

import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { GeometryBufferRenderer } from "./geometryBufferRenderer";
import { Constants } from "../Engines/constants";
import type { Nullable } from "../types";


Object.defineProperty(Scene.prototype, "geometryBufferRenderer", {
    get: function (this: Scene) {
        return this._geometryBufferRenderer;
    },
    set: function (this: Scene, value: Nullable<GeometryBufferRenderer>) {
        if (value && value.isSupported) {
            this._geometryBufferRenderer = value;
        }
    },
    enumerable: true,
    configurable: true,
});


Scene.prototype.enableGeometryBufferRenderer = function (
    ratio: number | { width: number; height: number } = 1,
    depthFormat = Constants.TEXTUREFORMAT_DEPTH16,
    textureTypesAndFormats?: { [key: number]: { textureType: number; textureFormat: number } }
): Nullable<GeometryBufferRenderer> {
    if (this._geometryBufferRenderer) {
        return this._geometryBufferRenderer;
    }

    this._geometryBufferRenderer = new GeometryBufferRenderer(this, ratio, depthFormat, textureTypesAndFormats);
    if (!this._geometryBufferRenderer.isSupported) {
        this._geometryBufferRenderer = null;
    }

    return this._geometryBufferRenderer;
};


Scene.prototype.disableGeometryBufferRenderer = function (): void {
    if (!this._geometryBufferRenderer) {
        return;
    }

    this._geometryBufferRenderer.dispose();
    this._geometryBufferRenderer = null;
};


GeometryBufferRenderer._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER) as GeometryBufferRendererSceneComponent;
    if (!component) {
        component = new GeometryBufferRendererSceneComponent(scene);
        scene._addComponent(component);
    }
};
