/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshSimplificationSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshSimplificationSceneComponent.pure";

import { SimplicationQueueSceneComponent } from "./meshSimplificationSceneComponent.pure";
import { Scene } from "../scene";
import { ISimplificationSettings, SimplificationQueue, SimplificationType } from "./meshSimplification";
import { SceneComponentConstants } from "../sceneComponent";
import { Mesh } from "./mesh";

declare module "../scene" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _simplificationQueue: SimplificationQueue;

        /**
         * Gets or sets the simplification queue attached to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
         */
        simplificationQueue: SimplificationQueue;
    }
}

declare module "../Meshes/mesh" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Mesh {
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async
         * @param settings a collection of simplification settings
         * @param parallelProcessing should all levels calculate parallel or one after the other
         * @param simplificationType the type of simplification to run
         * @param successCallback optional success callback to be called after the simplification finished processing all settings
         * @returns the current mesh
         */
        simplify(
            settings: Array<ISimplificationSettings>,
            parallelProcessing?: boolean,
            simplificationType?: SimplificationType,
            successCallback?: (mesh?: Mesh, submeshIndex?: number) => void
        ): Mesh;
    }
}

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
