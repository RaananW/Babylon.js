/** This file must only contain pure code and pure imports */

import type { Nullable } from "core/types";


declare module "./standardMaterial" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface StandardMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}
