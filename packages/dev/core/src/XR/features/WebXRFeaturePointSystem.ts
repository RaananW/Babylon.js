/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRFeaturePointSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRFeaturePointSystem.pure";

import { WebXRFeaturePointSystem } from "./WebXRFeaturePointSystem.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRFeaturePointSystem.Name,
    (xrSessionManager) => {
        return () => new WebXRFeaturePointSystem(xrSessionManager);
    },
    WebXRFeaturePointSystem.Version
);
