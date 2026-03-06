/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRWalkingLocomotion.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRWalkingLocomotion.pure";

import { WebXRWalkingLocomotion } from "./WebXRWalkingLocomotion.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRWalkingLocomotion.Name,
    (xrSessionManager, options) => {
        return () => new WebXRWalkingLocomotion(xrSessionManager, options);
    },
    WebXRWalkingLocomotion.Version,
    false
);
