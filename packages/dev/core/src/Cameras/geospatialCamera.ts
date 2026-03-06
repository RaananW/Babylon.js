/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geospatialCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geospatialCamera.pure";

import { GeospatialCamera } from "./geospatialCamera.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.GeospatialCamera", GeospatialCamera);
