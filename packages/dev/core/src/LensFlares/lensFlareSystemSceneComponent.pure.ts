/** This file must only contain pure code and pure imports */

import { Tools } from "../Misc/tools.pure";
import type { Camera } from "../Cameras/camera";
import { Scene } from "../scene.pure";
import type { ISceneSerializableComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { IAssetContainer } from "core/IAssetContainer";

/**
 * Defines the lens flare scene component responsible to manage any lens flares
 * in a given scene.
 */
export class LensFlareSystemSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_LENSFLARESYSTEM;

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
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LENSFLARESYSTEM, this, this._draw);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        for (let index = 0; index < this.scene.lensFlareSystems.length; index++) {
            this.scene.lensFlareSystems[index].rebuild();
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: IAssetContainer): void {
        if (!container.lensFlareSystems) {
            return;
        }
        for (const o of container.lensFlareSystems) {
            this.scene.addLensFlareSystem(o);
        }
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: IAssetContainer, dispose?: boolean): void {
        if (!container.lensFlareSystems) {
            return;
        }
        for (const o of container.lensFlareSystems) {
            this.scene.removeLensFlareSystem(o);
            if (dispose) {
                o.dispose();
            }
        }
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        // Lens flares
        serializationObject.lensFlareSystems = [];
        const lensFlareSystems = this.scene.lensFlareSystems;
        for (const lensFlareSystem of lensFlareSystems) {
            serializationObject.lensFlareSystems.push(lensFlareSystem.serialize());
        }
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        const lensFlareSystems = this.scene.lensFlareSystems;
        while (lensFlareSystems.length) {
            lensFlareSystems[0].dispose();
        }
    }

    private _draw(camera: Camera): void {
        // Lens flares
        if (this.scene.lensFlaresEnabled) {
            const lensFlareSystems = this.scene.lensFlareSystems;
            Tools.StartPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
            for (const lensFlareSystem of lensFlareSystems) {
                if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                    lensFlareSystem.render();
                }
            }
            Tools.EndPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
        }
    }
}
