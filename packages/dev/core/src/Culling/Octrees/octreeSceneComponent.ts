/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import octreeSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./octreeSceneComponent.pure";

import { OctreeSceneComponent } from "./octreeSceneComponent.pure";
import { Scene } from "../../scene";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SceneComponentConstants } from "../../sceneComponent";
import { Octree } from "./octree";

Scene.prototype.createOrUpdateSelectionOctree = function (maxCapacity = 64, maxDepth = 2): Octree<AbstractMesh> {
    let component = this._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(this);
        this._addComponent(component);
    }

    if (!this._selectionOctree) {
        this._selectionOctree = new Octree<AbstractMesh>(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
    }

    const worldExtends = this.getWorldExtends();

    // Update octree
    this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);

    return this._selectionOctree;
};

Object.defineProperty(Scene.prototype, "selectionOctree", {
    get: function (this: Scene) {
        return this._selectionOctree;
    },
    enumerable: true,
    configurable: true,
});

/**
 * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
 * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
 * @param maxCapacity defines the maximum size of each block (64 by default)
 * @param maxDepth defines the maximum depth to use (no more than 2 levels by default)
 * @returns the new octree
 * @see https://www.babylonjs-playground.com/#NA4OQ#12
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
 */
AbstractMesh.prototype.createOrUpdateSubmeshesOctree = function (maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
    const scene = this.getScene();
    let component = scene._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(scene);
        scene._addComponent(component);
    }

    if (!this._submeshesOctree) {
        this._submeshesOctree = new Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
    }

    this.computeWorldMatrix(true);

    const boundingInfo = this.getBoundingInfo();

    // Update octree
    const bbox = boundingInfo.boundingBox;
    this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);

    return this._submeshesOctree;
};
