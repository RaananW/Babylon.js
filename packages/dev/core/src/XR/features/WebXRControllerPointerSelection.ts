/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerPointerSelection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerPointerSelection.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRControllerPointerSelection.Name,
    (xrSessionManager, options) => {
        return () => new WebXRControllerPointerSelection(xrSessionManager, options);
    },
    WebXRControllerPointerSelection.Version,
    true
);
