/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRHitTest.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRHitTest.pure";

import { WebXRHitTest } from "./WebXRHitTest.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";

//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(
    WebXRHitTest.Name,
    (xrSessionManager, options) => {
        return () => new WebXRHitTest(xrSessionManager, options);
    },
    WebXRHitTest.Version,
    false
);
