/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import database.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./database.pure";

import { AbstractEngine } from "core/Engines/abstractEngine";


// Sets the default offline provider to Babylon.js
AbstractEngine.OfflineProviderFactory = (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck = false) => {
    return new Database(urlToScene, callbackManifestChecked, disableManifestCheck);
};
