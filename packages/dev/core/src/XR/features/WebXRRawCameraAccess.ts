/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRRawCameraAccess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRRawCameraAccess.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


WebXRFeaturesManager.AddWebXRFeature(
    WebXRRawCameraAccess.Name,
    (xrSessionManager, options) => {
        return () => new WebXRRawCameraAccess(xrSessionManager, options);
    },
    WebXRRawCameraAccess.Version,
    false
);
