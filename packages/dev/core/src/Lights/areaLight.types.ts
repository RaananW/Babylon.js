import type { ILTCTextures } from "core/Lights/LTC/ltcTextureTool";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * @internal
         */
        _ltcTextures?: ILTCTextures;
    }
}
