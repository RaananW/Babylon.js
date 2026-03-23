import type { ThinDepthPeelingRenderer } from "./thinDepthPeelingRenderer";
import type { Nullable } from "../types";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * The depth peeling renderer
         */
        depthPeelingRenderer: Nullable<ThinDepthPeelingRenderer>;
        /** @internal (Backing field) */
        _depthPeelingRenderer: Nullable<ThinDepthPeelingRenderer>;

        /**
         * Flag to indicate if we want to use order independent transparency, despite the performance hit
         */
        useOrderIndependentTransparency: boolean;
        /** @internal */
        _useOrderIndependentTransparency: boolean;
    }
}
