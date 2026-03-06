/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerTeleportation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerTeleportation.pure";

import { WebXRMotionControllerTeleportation } from "./WebXRControllerTeleportation.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

WebXRFeaturesManager.AddWebXRFeature(
    WebXRMotionControllerTeleportation.Name,
    (xrSessionManager, options) => {
        return () => new WebXRMotionControllerTeleportation(xrSessionManager, options);
    },
    WebXRMotionControllerTeleportation.Version,
    true
);
