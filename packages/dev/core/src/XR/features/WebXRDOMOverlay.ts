/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRDOMOverlay.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRDOMOverlay.pure";

import { WebXRDomOverlay } from "./WebXRDOMOverlay.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRDomOverlay.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDomOverlay(xrSessionManager, options);
    },
    WebXRDomOverlay.Version,
    false
);
