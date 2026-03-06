/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRImageTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRImageTracking.pure";

import { WebXRImageTracking } from "./WebXRImageTracking.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRImageTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXRImageTracking(xrSessionManager, options);
    },
    WebXRImageTracking.Version,
    false
);
