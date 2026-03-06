/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRLayers.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRLayers.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLayers.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLayers(xrSessionManager, options);
    },
    WebXRLayers.Version,
    false
);
