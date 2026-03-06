/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowMapBlock.pure";

import { ShadowMapBlock } from "./shadowMapBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ShadowMapBlock", ShadowMapBlock);
