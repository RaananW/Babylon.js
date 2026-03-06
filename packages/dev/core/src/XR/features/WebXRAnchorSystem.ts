/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRAnchorSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRAnchorSystem.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRAnchorSystem.Name,
    (xrSessionManager, options) => {
        return () => new WebXRAnchorSystem(xrSessionManager, options);
    },
    WebXRAnchorSystem.Version
);
