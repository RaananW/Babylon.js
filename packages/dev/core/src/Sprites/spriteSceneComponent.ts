/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import spriteSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./spriteSceneComponent.pure";

import { InternalSpriteAugmentedScene } from "./spriteSceneComponent.pure";
import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Scene } from "../scene";
import { Sprite } from "./sprite";
import { ISpriteManager } from "./spriteManager";
import { Ray, CreatePickingRayInCameraSpace, CreatePickingRayInCameraSpaceToRef } from "../Culling/ray.core";
import { Camera } from "../Cameras/camera";
import { PickingInfo } from "../Collisions/pickingInfo";
import { ActionEvent } from "../Actions/actionEvent";
import { Constants } from "../Engines/constants";

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
