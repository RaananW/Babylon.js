/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRLightEstimation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRLightEstimation.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLightEstimation.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLightEstimation(xrSessionManager, options);
    },
    WebXRLightEstimation.Version,
    false
);
