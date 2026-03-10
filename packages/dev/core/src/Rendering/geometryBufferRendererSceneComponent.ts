/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryBufferRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryBufferRendererSceneComponent.pure";

import { GeometryBufferRendererSceneComponent } from "./geometryBufferRendererSceneComponent.pure";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { GeometryBufferRenderer } from "./geometryBufferRenderer";
import { Constants } from "../Engines/constants";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal (Backing field) */
        _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Gets or Sets the current geometry buffer associated to the scene.
         */
        geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Enables a GeometryBufferRender and associates it with the scene
         * @param ratioOrDimensions defines the scaling ratio to apply to the renderer (1 by default which means same resolution). You can also directly pass a width and height for the generated textures
         * @param depthFormat Format of the depth texture (default: Constants.TEXTUREFORMAT_DEPTH16)
         * @param textureTypesAndFormats The types and formats of textures to create as render targets. If not provided, all textures will be RGBA and float or half float, depending on the engine capabilities.
         * @returns the GeometryBufferRenderer
         */
        enableGeometryBufferRenderer(
            ratioOrDimensions?:
                | number
                | {
                      /**
                       *
                       */
                      width: number /**
                       *
                       */;
                      height: number;
                  },
            depthFormat?: number,
            textureTypesAndFormats?: {
                [key: number]: {
                    /**
                     *
                     */
                    textureType: number /**
                     *
                     */;
                    textureFormat: number;
                };
            }
        ): Nullable<GeometryBufferRenderer>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableGeometryBufferRenderer(): void;
    }
}

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
