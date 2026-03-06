/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerPhysics.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerPhysics.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRControllerPhysics.Name,
    (xrSessionManager, options) => {
        return () => new WebXRControllerPhysics(xrSessionManager, options);
    },
    WebXRControllerPhysics.Version,
    true
);
