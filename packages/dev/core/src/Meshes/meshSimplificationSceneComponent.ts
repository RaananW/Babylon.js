/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshSimplificationSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshSimplificationSceneComponent.pure";

import { Scene } from "../scene";
import { Mesh } from "./mesh";
import { SimplificationQueue, SimplificationType } from "./meshSimplification";
import { SceneComponentConstants } from "../sceneComponent";
import type { ISimplificationSettings } from "./meshSimplification";

Object.defineProperty(Scene.prototype, "simplificationQueue", {
    get: function (this: Scene) {
        if (!this._simplificationQueue) {
            this._simplificationQueue = new SimplificationQueue();
            let component = this._getComponent(SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE) as SimplicationQueueSceneComponent;
            if (!component) {
                component = new SimplicationQueueSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._simplificationQueue;
    },
    set: function (this: Scene, value: SimplificationQueue) {
        this._simplificationQueue = value;
    },
    enumerable: true,
    configurable: true,
});


Mesh.prototype.simplify = function (
    settings: Array<ISimplificationSettings>,
    parallelProcessing: boolean = true,
    simplificationType: SimplificationType = SimplificationType.QUADRATIC,
    successCallback?: (mesh?: Mesh, submeshIndex?: number) => void
): Mesh {
    this.getScene().simplificationQueue.addTask({
        settings: settings,
        parallelProcessing: parallelProcessing,
        mesh: this,
        simplificationType: simplificationType,
        successCallback: successCallback,
    });
    return this;
};
