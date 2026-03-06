/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRBackgroundRemover.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRBackgroundRemover.pure";

import { WebXRBackgroundRemover } from "./WebXRBackgroundRemover.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRBackgroundRemover.Name,
    (xrSessionManager, options) => {
        return () => new WebXRBackgroundRemover(xrSessionManager, options);
    },
    WebXRBackgroundRemover.Version,
    true
);
