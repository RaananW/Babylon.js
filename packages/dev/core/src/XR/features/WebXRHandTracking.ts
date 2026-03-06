/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRHandTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRHandTracking.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRHandTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXRHandTracking(xrSessionManager, options);
    },
    WebXRHandTracking.Version,
    false
);
