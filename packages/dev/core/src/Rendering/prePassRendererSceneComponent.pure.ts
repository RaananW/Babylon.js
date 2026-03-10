/** This file must only contain pure code and pure imports */

import type { Nullable } from "../types";
import { Scene } from "../scene.pure";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { SubMesh } from "../Meshes/subMesh";
import type { _InstancesBatch } from "../Meshes/mesh";
import type { Effect } from "../Materials/effect";
import type { Camera } from "../Cameras/camera";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";

/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class PrePassRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_PREPASSRENDERER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_PREPASS, this, this._beforeCameraDraw);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_PREPASS, this, this._afterCameraDraw);
        this.scene._beforeRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_PREPASS, this, this._beforeRenderTargetDraw);
        this.scene._afterRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_PREPASS, this, this._afterRenderTargetDraw);

        this.scene._beforeClearStage.registerStep(SceneComponentConstants.STEP_BEFORECLEAR_PREPASS, this, this._beforeClearStage);
        this.scene._beforeRenderTargetClearStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERTARGETCLEAR_PREPASS, this, this._beforeRenderTargetClearStage);

        this.scene._beforeRenderingMeshStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERINGMESH_PREPASS, this, this._beforeRenderingMeshStage);
        this.scene._afterRenderingMeshStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGMESH_PREPASS, this, this._afterRenderingMeshStage);
    }

    private _beforeRenderTargetDraw(renderTarget: RenderTargetTexture, faceIndex?: number, layer?: number) {
        if (this.scene.prePassRenderer && !renderTarget.noPrePassRenderer) {
            this.scene.prePassRenderer._setRenderTarget(renderTarget._prePassRenderTarget);
            this.scene.prePassRenderer._beforeDraw(undefined, faceIndex, layer);
        }
    }

    private _afterRenderTargetDraw(renderTarget: RenderTargetTexture, faceIndex?: number, layer?: number) {
        if (this.scene.prePassRenderer && !renderTarget.noPrePassRenderer) {
            this.scene.prePassRenderer._afterDraw(faceIndex, layer);
        }
    }

    private _beforeRenderTargetClearStage(renderTarget: RenderTargetTexture) {
        if (this.scene.prePassRenderer && !renderTarget.noPrePassRenderer) {
            if (!renderTarget._prePassRenderTarget) {
                renderTarget._prePassRenderTarget = this.scene.prePassRenderer._createRenderTarget(renderTarget.name + "_prePassRTT", renderTarget);
            }
            this.scene.prePassRenderer._setRenderTarget(renderTarget._prePassRenderTarget);
            this.scene.prePassRenderer._clear();
        }
    }

    private _beforeCameraDraw(camera: Camera) {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer._setRenderTarget(null);
            this.scene.prePassRenderer._beforeDraw(camera);
        }
    }

    private _afterCameraDraw() {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer._afterDraw();
        }
    }

    private _beforeClearStage() {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer._setRenderTarget(null);
            this.scene.prePassRenderer._clear();
        }
    }

    private _beforeRenderingMeshStage(mesh: AbstractMesh, subMesh: SubMesh, batch: _InstancesBatch, effect: Nullable<Effect>) {
        if (!effect) {
            return;
        }

        // Render to MRT
        const scene = mesh.getScene();
        if (scene.prePassRenderer) {
            scene.prePassRenderer.bindAttachmentsForEffect(effect, subMesh);
        }
    }

    private _afterRenderingMeshStage(mesh: AbstractMesh) {
        const scene = mesh.getScene();

        if (scene.prePassRenderer) {
            scene.prePassRenderer.restoreAttachments();
        }
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        this.scene.disablePrePassRenderer();
    }
}
