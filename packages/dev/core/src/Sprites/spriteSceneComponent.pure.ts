/** This file must only contain pure code and pure imports */

import type { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Scene } from "../scene.pure";
import type { Sprite } from "./sprite";
import type { ISpriteManager } from "./spriteManager";
import { Ray, RayZero } from "../Culling/ray.core";
import type { Camera } from "../Cameras/camera";
import { PickingInfo } from "../Collisions/pickingInfo";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { ActionEventCreateNewFromSprite } from "../Actions/actionEvent.pure";
import { Constants } from "../Engines/constants";
import type { IPointerEvent } from "../Events/deviceInputEvents";

/** @internal */
export type InternalSpriteAugmentedScene = Scene & {
    _onNewSpriteManagerAddedObservable?: Observable<ISpriteManager>;
    _onSpriteManagerRemovedObservable?: Observable<ISpriteManager>;
};

/**
 * Defines the sprite scene component responsible to manage sprites
 * in a given scene.
 */
export class SpriteSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_SPRITE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /** @internal */
    private _spritePredicate: (sprite: Sprite) => boolean;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.spriteManagers = [] as ISpriteManager[];
        // This ray is used to pick sprites in the scene
        this.scene._tempSpritePickingRay = Ray ? RayZero() : null;
        this.scene.onBeforeSpritesRenderingObservable = new Observable<Scene>();
        this.scene.onAfterSpritesRenderingObservable = new Observable<Scene>();
        this._spritePredicate = (sprite: Sprite): boolean => {
            if (!sprite.actionManager) {
                return false;
            }
            return sprite.isPickable && sprite.actionManager.hasPointerTriggers;
        };
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._pointerMoveStage.registerStep(SceneComponentConstants.STEP_POINTERMOVE_SPRITE, this, this._pointerMove);
        this.scene._pointerDownStage.registerStep(SceneComponentConstants.STEP_POINTERDOWN_SPRITE, this, this._pointerDown);
        this.scene._pointerUpStage.registerStep(SceneComponentConstants.STEP_POINTERUP_SPRITE, this, this._pointerUp);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        /** Nothing to do for sprites */
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        this.scene.onBeforeSpritesRenderingObservable.clear();
        this.scene.onAfterSpritesRenderingObservable.clear();

        const spriteManagers = this.scene.spriteManagers;
        if (!spriteManagers) {
            return;
        }
        while (spriteManagers.length) {
            spriteManagers[0].dispose();
        }
    }

    private _pickSpriteButKeepRay(originalPointerInfo: Nullable<PickingInfo>, x: number, y: number, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo> {
        const result = this.scene.pickSprite(x, y, this._spritePredicate, fastCheck, camera);
        if (result) {
            result.ray = originalPointerInfo ? originalPointerInfo.ray : null;
        }
        return result;
    }

    private _pointerMove(
        unTranslatedPointerX: number,
        unTranslatedPointerY: number,
        pickResult: Nullable<PickingInfo>,
        isMeshPicked: boolean,
        element: Nullable<HTMLElement>
    ): Nullable<PickingInfo> {
        const scene = this.scene;
        if (isMeshPicked) {
            scene.setPointerOverSprite(null);
        } else {
            pickResult = this._pickSpriteButKeepRay(pickResult, unTranslatedPointerX, unTranslatedPointerY, false, scene.cameraToUseForPointers || undefined);

            if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                scene.setPointerOverSprite(pickResult.pickedSprite);
                if (!scene.doNotHandleCursors && element) {
                    if (scene._pointerOverSprite && scene._pointerOverSprite.actionManager && scene._pointerOverSprite.actionManager.hoverCursor) {
                        element.style.cursor = scene._pointerOverSprite.actionManager.hoverCursor;
                    } else {
                        element.style.cursor = scene.hoverCursor;
                    }
                }
            } else {
                scene.setPointerOverSprite(null);
            }
        }

        return pickResult;
    }

    private _pointerDown(unTranslatedPointerX: number, unTranslatedPointerY: number, pickResult: Nullable<PickingInfo>, evt: IPointerEvent): Nullable<PickingInfo> {
        const scene = this.scene;
        scene._pickedDownSprite = null;
        if (scene.spriteManagers && scene.spriteManagers.length > 0) {
            pickResult = scene.pickSprite(unTranslatedPointerX, unTranslatedPointerY, this._spritePredicate, false, scene.cameraToUseForPointers || undefined);

            if (pickResult && pickResult.hit && pickResult.pickedSprite) {
                if (pickResult.pickedSprite.actionManager) {
                    scene._pickedDownSprite = pickResult.pickedSprite;
                    switch (evt.button) {
                        case 0:
                            pickResult.pickedSprite.actionManager.processTrigger(
                                Constants.ACTION_OnLeftPickTrigger,
                                ActionEventCreateNewFromSprite(pickResult.pickedSprite, scene, evt)
                            );
                            break;
                        case 1:
                            pickResult.pickedSprite.actionManager.processTrigger(
                                Constants.ACTION_OnCenterPickTrigger,
                                ActionEventCreateNewFromSprite(pickResult.pickedSprite, scene, evt)
                            );
                            break;
                        case 2:
                            pickResult.pickedSprite.actionManager.processTrigger(
                                Constants.ACTION_OnRightPickTrigger,
                                ActionEventCreateNewFromSprite(pickResult.pickedSprite, scene, evt)
                            );
                            break;
                    }
                    if (pickResult.pickedSprite.actionManager) {
                        pickResult.pickedSprite.actionManager.processTrigger(
                            Constants.ACTION_OnPickDownTrigger,
                            ActionEventCreateNewFromSprite(pickResult.pickedSprite, scene, evt)
                        );
                    }
                }
            }
        }

        return pickResult;
    }

    private _pointerUp(
        unTranslatedPointerX: number,
        unTranslatedPointerY: number,
        pickResult: Nullable<PickingInfo>,
        evt: IPointerEvent,
        doubleClick: boolean
    ): Nullable<PickingInfo> {
        const scene = this.scene;
        if (scene.spriteManagers && scene.spriteManagers.length > 0) {
            const spritePickResult = scene.pickSprite(unTranslatedPointerX, unTranslatedPointerY, this._spritePredicate, false, scene.cameraToUseForPointers || undefined);

            if (spritePickResult) {
                if (spritePickResult.hit && spritePickResult.pickedSprite) {
                    if (spritePickResult.pickedSprite.actionManager) {
                        spritePickResult.pickedSprite.actionManager.processTrigger(
                            Constants.ACTION_OnPickUpTrigger,
                            ActionEventCreateNewFromSprite(spritePickResult.pickedSprite, scene, evt)
                        );

                        if (spritePickResult.pickedSprite.actionManager) {
                            if (!this.scene._inputManager._isPointerSwiping()) {
                                spritePickResult.pickedSprite.actionManager.processTrigger(
                                    Constants.ACTION_OnPickTrigger,
                                    ActionEventCreateNewFromSprite(spritePickResult.pickedSprite, scene, evt)
                                );
                            }

                            if (doubleClick) {
                                spritePickResult.pickedSprite.actionManager.processTrigger(
                                    Constants.ACTION_OnDoublePickTrigger,
                                    ActionEventCreateNewFromSprite(spritePickResult.pickedSprite, scene, evt)
                                );
                            }
                        }
                    }
                }
                if (scene._pickedDownSprite && scene._pickedDownSprite.actionManager && scene._pickedDownSprite !== spritePickResult.pickedSprite) {
                    scene._pickedDownSprite.actionManager.processTrigger(Constants.ACTION_OnPickOutTrigger, ActionEventCreateNewFromSprite(scene._pickedDownSprite, scene, evt));
                }
            }
        }

        return pickResult;
    }
}
