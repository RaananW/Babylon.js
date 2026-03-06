/** This file must only contain pure code and pure imports */

import type { Nullable } from "../types";
import { Scene } from "../scene";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Observer } from "../Misc/observable";
import type { IblCdfGenerator } from "./iblCdfGenerator";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Gets or Sets the current CDF generator associated to the scene.
         * The CDF (cumulative distribution function) generator creates CDF maps
         * for a given IBL texture that can then be used for more efficient
         * importance sampling.
         */
        iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Enables a IblCdfGenerator and associates it with the scene.
         * @returns the IblCdfGenerator
         */
        enableIblCdfGenerator(): Nullable<IblCdfGenerator>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableIblCdfGenerator(): void;
    }
}

/**
 * Defines the IBL CDF Generator scene component responsible for generating CDF maps for a given IBL.
 */
export class IblCdfGeneratorSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_IBLCDFGENERATOR;

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
        this._updateIblSource();
        this._newIblObserver = this.scene.onEnvironmentTextureChangedObservable.add(this._updateIblSource.bind(this));
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
        this.scene.onEnvironmentTextureChangedObservable.remove(this._newIblObserver);
    }

    private _updateIblSource(): void {
        if (this.scene.iblCdfGenerator && this.scene.environmentTexture) {
            this.scene.iblCdfGenerator.iblSource = this.scene.environmentTexture;
        }
    }

    private _newIblObserver: Nullable<Observer<Nullable<BaseTexture>>> = null;
}
