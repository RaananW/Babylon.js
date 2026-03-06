/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instancesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instancesBlock.pure";

import { InstancesBlock } from "./instancesBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstancesBlock", InstancesBlock);
