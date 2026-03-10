/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthPeelingSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthPeelingSceneComponent.pure";

import { DepthPeelingSceneComponent } from "./depthPeelingSceneComponent.pure";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import type { ThinDepthPeelingRenderer } from "./thinDepthPeelingRenderer";
import { Constants } from "../Engines/constants";
import type { Nullable } from "../types";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * The depth peeling renderer
         */
        depthPeelingRenderer: Nullable<ThinDepthPeelingRenderer>;
        /** @internal (Backing field) */
        _depthPeelingRenderer: Nullable<ThinDepthPeelingRenderer>;

        /**
         * Flag to indicate if we want to use order independent transparency, despite the performance hit
         */
        useOrderIndependentTransparency: boolean;
        /** @internal */
        _useOrderIndependentTransparency: boolean;
    }
}

Object.defineProperty(Scene.prototype, "depthPeelingRenderer", {
    get: function (this: Scene) {
        if (!this._depthPeelingRenderer) {
            let component = this._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER) as DepthPeelingSceneComponent;
            if (!component) {
                component = new DepthPeelingSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._depthPeelingRenderer;
    },
    set: function (this: Scene, value: ThinDepthPeelingRenderer) {
        this._depthPeelingRenderer = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Scene.prototype, "useOrderIndependentTransparency", {
    get: function (this: Scene) {
        return this._useOrderIndependentTransparency;
    },
    set: function (this: Scene, value: boolean) {
        if (this._useOrderIndependentTransparency === value) {
            return;
        }
        this._useOrderIndependentTransparency = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
        this.prePassRenderer?.markAsDirty();
    },
    enumerable: true,
    configurable: true,
});
