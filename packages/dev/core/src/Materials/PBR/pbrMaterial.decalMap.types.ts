import { type DecalMapConfiguration } from "../material.decalMapConfiguration"
import { type Nullable } from "core/types"
declare module "./pbrBaseMaterial" {
    /**
     *
     */
    export interface PBRBaseMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}
