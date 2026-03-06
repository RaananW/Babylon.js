/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcessRenderPipelineManagerSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcessRenderPipelineManagerSceneComponent.pure";

import { PostProcessRenderPipelineManagerSceneComponent } from "./postProcessRenderPipelineManagerSceneComponent.pure";
import { SceneComponentConstants } from "../../sceneComponent";
import { Scene } from "../../scene";
import { PostProcessRenderPipelineManager } from "./postProcessRenderPipelineManager";

Object.defineProperty(Scene.prototype, "postProcessRenderPipelineManager", {
    get: function (this: Scene) {
        if (!this._postProcessRenderPipelineManager) {
            // Register the G Buffer component to the scene.
            let component = this._getComponent(SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER) as PostProcessRenderPipelineManagerSceneComponent;
            if (!component) {
                component = new PostProcessRenderPipelineManagerSceneComponent(this);
                this._addComponent(component);
            }
            this._postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();
        }

        return this._postProcessRenderPipelineManager;
    },
    enumerable: true,
    configurable: true,
});
