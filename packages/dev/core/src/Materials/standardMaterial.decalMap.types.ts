import type { DecalMapConfiguration } from "./material.decalMapConfiguration";
import type { Nullable } from "core/types";

declare module "./standardMaterial" {
    /**
     *
     */
    export interface StandardMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}
