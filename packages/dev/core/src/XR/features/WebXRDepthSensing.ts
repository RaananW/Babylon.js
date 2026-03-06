/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRDepthSensing.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRDepthSensing.pure";

import { WebXRDepthSensing } from "./WebXRDepthSensing.pure";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";
import { RegisterClass } from "../../Misc/typeStore";
import { WebXRDepthSensingMaterialPlugin } from "./WebXRDepthSensing.pure";

RegisterClass(`BABYLON.DepthSensingMaterialPlugin`, WebXRDepthSensingMaterialPlugin);

WebXRFeaturesManager.AddWebXRFeature(
    WebXRDepthSensing.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDepthSensing(xrSessionManager, options);
    },
    WebXRDepthSensing.Version,
    false
);
