/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import spriteSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./spriteSceneComponent.pure";

import type { InternalSpriteAugmentedScene } from "./spriteSceneComponent.pure";
import type { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Scene } from "../scene";
import type { Sprite } from "./sprite";
import type { ISpriteManager } from "./spriteManager";
import { Ray, CreatePickingRayInCameraSpace, CreatePickingRayInCameraSpaceToRef } from "../Culling/ray.core";
import type { Camera } from "../Cameras/camera";
import { PickingInfo } from "../Collisions/pickingInfo";
import { ActionEvent } from "../Actions/actionEvent";
import { Constants } from "../Engines/constants";
import type { IReadonlyObservable } from "../Misc/observable";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal */
        _pointerOverSprite: Nullable<Sprite>;

        /** @internal */
        _pickedDownSprite: Nullable<Sprite>;

        /** @internal */
        _tempSpritePickingRay: Nullable<Ray>;

        /**
         * All of the sprite managers added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/sprites
         */
        spriteManagers?: Array<ISpriteManager>;

        /**
         * An event triggered when a sprite manager is added to the scene
         */
        readonly onNewSpriteManagerAddedObservable: IReadonlyObservable<ISpriteManager>;

        /**
         * An event triggered when a sprite manager is removed from the scene
         */
        readonly onSpriteManagerRemovedObservable: IReadonlyObservable<ISpriteManager>;

        /**
         * An event triggered when sprites rendering is about to start
         * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
         */
        onBeforeSpritesRenderingObservable: Observable<Scene>;

        /**
         * An event triggered when sprites rendering is done
         * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
         */
        onAfterSpritesRenderingObservable: Observable<Scene>;

        /** @internal */
        _internalPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck defines if the first intersection will be used (and not the closest)
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** Use the given ray to pick a sprite in the scene
         * @param ray The ray (in world space) to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck defines if the first intersection will be used (and not the closest)
         * @param camera camera to use. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo
         */
        pickSpriteWithRay(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;

        /** @internal */
        _internalMultiPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /** Launch a ray to try to pick sprites in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo array
         */
        multiPickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /** Use the given ray to pick sprites in the scene
         * @param ray The ray (in world space) to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param camera camera to use. Can be set to null. In this case, the scene.activeCamera will be used
         * @returns a PickingInfo array
         */
        multiPickSpriteWithRay(ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]>;

        /**
         * Force the sprite under the pointer
         * @param sprite defines the sprite to use
         */
        setPointerOverSprite(sprite: Nullable<Sprite>): void;

        /**
         * Gets the sprite under the pointer
         * @returns a Sprite or null if no sprite is under the pointer
         */
        getPointerOverSprite(): Nullable<Sprite>;
    }
}

Object.defineProperty(Scene.prototype, "onNewSpriteManagerAddedObservable", {
    get: function (this: InternalSpriteAugmentedScene) {
        if (!this.isDisposed && !this._onNewSpriteManagerAddedObservable) {
            const onNewSpriteManagerAddedObservable = (this._onNewSpriteManagerAddedObservable = new Observable<ISpriteManager>());
            this.onDisposeObservable.addOnce(() => onNewSpriteManagerAddedObservable.clear());
        }
        return this._onNewSpriteManagerAddedObservable;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Scene.prototype, "onSpriteManagerRemovedObservable", {
    get: function (this: InternalSpriteAugmentedScene) {
        if (!this.isDisposed && !this._onSpriteManagerRemovedObservable) {
            const onSpriteManagerRemovedObservable = (this._onSpriteManagerRemovedObservable = new Observable<ISpriteManager>());
            this.onDisposeObservable.addOnce(() => onSpriteManagerRemovedObservable.clear());
        }
        return this._onSpriteManagerRemovedObservable;
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype._internalPickSprites = function (ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
    if (!PickingInfo) {
        return null;
    }

    let pickingInfo = null;

    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }

    if (this.spriteManagers && this.spriteManagers.length > 0) {
        for (let spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
            const spriteManager = this.spriteManagers[spriteIndex];

            if (!spriteManager.isPickable) {
                continue;
            }

            const result = spriteManager.intersects(ray, camera, predicate, fastCheck);
            if (!result || !result.hit) {
                continue;
            }

            if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance) {
                continue;
            }

            pickingInfo = result;

            if (fastCheck) {
                break;
            }
        }
    }

    return pickingInfo || new PickingInfo();
};

Scene.prototype._internalMultiPickSprites = function (ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]> {
    if (!PickingInfo) {
        return null;
    }

    let pickingInfos: PickingInfo[] = [];

    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }

    if (this.spriteManagers && this.spriteManagers.length > 0) {
        for (let spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
            const spriteManager = this.spriteManagers[spriteIndex];

            if (!spriteManager.isPickable) {
                continue;
            }

            const results = spriteManager.multiIntersects(ray, camera, predicate);

            if (results !== null) {
                pickingInfos = pickingInfos.concat(results);
            }
        }
    }

    return pickingInfos;
};

Scene.prototype.pickSprite = function (x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
    if (!this._tempSpritePickingRay) {
        return null;
    }

    CreatePickingRayInCameraSpaceToRef(this, x, y, this._tempSpritePickingRay, camera);

    const result = this._internalPickSprites(this._tempSpritePickingRay, predicate, fastCheck, camera);
    if (result) {
        result.ray = CreatePickingRayInCameraSpace(this, x, y, camera);
    }

    return result;
};

Scene.prototype.pickSpriteWithRay = function (ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
    if (!this._tempSpritePickingRay) {
        return null;
    }

    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }

    Ray.TransformToRef(ray, camera.getViewMatrix(), this._tempSpritePickingRay);

    const result = this._internalPickSprites(this._tempSpritePickingRay, predicate, fastCheck, camera);
    if (result) {
        result.ray = ray;
    }

    return result;
};

Scene.prototype.multiPickSprite = function (x: number, y: number, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]> {
    CreatePickingRayInCameraSpaceToRef(this, x, y, this._tempSpritePickingRay!, camera);

    return this._internalMultiPickSprites(this._tempSpritePickingRay!, predicate, camera);
};

Scene.prototype.multiPickSpriteWithRay = function (ray: Ray, predicate?: (sprite: Sprite) => boolean, camera?: Camera): Nullable<PickingInfo[]> {
    if (!this._tempSpritePickingRay) {
        return null;
    }

    if (!camera) {
        if (!this.activeCamera) {
            return null;
        }
        camera = this.activeCamera;
    }

    Ray.TransformToRef(ray, camera.getViewMatrix(), this._tempSpritePickingRay);

    return this._internalMultiPickSprites(this._tempSpritePickingRay, predicate, camera);
};

Scene.prototype.setPointerOverSprite = function (sprite: Nullable<Sprite>): void {
    if (this._pointerOverSprite === sprite) {
        return;
    }

    if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
        this._pointerOverSprite.actionManager.processTrigger(Constants.ACTION_OnPointerOutTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
    }

    this._pointerOverSprite = sprite;
    if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
        this._pointerOverSprite.actionManager.processTrigger(Constants.ACTION_OnPointerOverTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
    }
};

Scene.prototype.getPointerOverSprite = function (): Nullable<Sprite> {
    return this._pointerOverSprite;
};
