/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRSpaceWarp.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRSpaceWarp.pure";

import { WebXRFeaturesManager } from "../webXRFeaturesManager";


//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRSpaceWarp.Name,
    (xrSessionManager) => {
        return () => new WebXRSpaceWarp(xrSessionManager);
    },
    WebXRSpaceWarp.Version,
    false
);
