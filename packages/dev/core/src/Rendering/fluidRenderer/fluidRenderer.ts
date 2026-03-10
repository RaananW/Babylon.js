/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fluidRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fluidRenderer.pure";

import { FluidRenderer } from "./fluidRenderer.pure";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

declare module "../../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal (Backing field) */
        _fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Gets or Sets the fluid renderer associated to the scene.
         */
        fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Enables the fluid renderer and associates it with the scene
         * @returns the FluidRenderer
         */
        enableFluidRenderer(): Nullable<FluidRenderer>;

        /**
         * Disables the fluid renderer associated with the scene
         */
        disableFluidRenderer(): void;
    }
}

Object.defineProperty(Scene.prototype, "fluidRenderer", {
    get: function (this: Scene) {
        return this._fluidRenderer;
    },
    set: function (this: Scene, value: Nullable<FluidRenderer>) {
        this._fluidRenderer = value;
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.enableFluidRenderer = function (): Nullable<FluidRenderer> {
    if (this._fluidRenderer) {
        return this._fluidRenderer;
    }

    this._fluidRenderer = new FluidRenderer(this);

    return this._fluidRenderer;
};

Scene.prototype.disableFluidRenderer = function (): void {
    this._fluidRenderer?.dispose();
    this._fluidRenderer = null;
};
