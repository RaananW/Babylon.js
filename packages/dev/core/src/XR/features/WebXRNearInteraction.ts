/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRNearInteraction.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRNearInteraction.pure";

import { WebXRNearInteraction } from "./WebXRNearInteraction.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//Register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRNearInteraction.Name,
    (xrSessionManager, options) => {
        return () => new WebXRNearInteraction(xrSessionManager, options);
    },
    WebXRNearInteraction.Version,
    true
);
