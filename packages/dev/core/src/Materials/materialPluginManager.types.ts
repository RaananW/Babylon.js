import { type MaterialPluginManager } from "./materialPluginManager.pure"
declare module "./material" {
    /**
     *
     */
    export interface Material {
        /**
         * Plugin manager for this material
         */
        pluginManager?: MaterialPluginManager;
    }
}

export {};
