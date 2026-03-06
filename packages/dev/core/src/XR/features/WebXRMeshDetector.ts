/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRMeshDetector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRMeshDetector.pure";

import { WebXRMeshDetector } from "./WebXRMeshDetector.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

WebXRFeaturesManager.AddWebXRFeature(
    WebXRMeshDetector.Name,
    (xrSessionManager, options) => {
        return () => new WebXRMeshDetector(xrSessionManager, options);
    },
    WebXRMeshDetector.Version,
    false
);
