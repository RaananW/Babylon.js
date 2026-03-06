/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerMovement.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerMovement.pure";

import { WebXRControllerMovement } from "./WebXRControllerMovement.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

WebXRFeaturesManager.AddWebXRFeature(
    WebXRControllerMovement.Name,
    (xrSessionManager, options) => {
        return () => new WebXRControllerMovement(xrSessionManager, options);
    },
    WebXRControllerMovement.Version,
    true
);
