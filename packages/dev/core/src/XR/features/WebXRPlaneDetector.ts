/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRPlaneDetector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRPlaneDetector.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRPlaneDetector.Name,
    (xrSessionManager, options) => {
        return () => new WebXRPlaneDetector(xrSessionManager, options);
    },
    WebXRPlaneDetector.Version
);
