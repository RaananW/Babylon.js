/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXREyeTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXREyeTracking.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


WebXRFeaturesManager.AddWebXRFeature(
    WebXREyeTracking.Name,
    (xrSessionManager) => {
        return () => new WebXREyeTracking(xrSessionManager);
    },
    WebXREyeTracking.Version,
    false
);
