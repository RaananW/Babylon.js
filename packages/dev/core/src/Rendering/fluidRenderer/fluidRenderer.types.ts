import type { FluidRenderer } from "./fluidRenderer.pure";
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
