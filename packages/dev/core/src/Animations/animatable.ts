/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import animatable.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./animatable.pure";

import { Bone } from "../Bones/bone";
import { AddAnimationExtensions } from "./animatable.core";
import { Scene } from "core/scene";


// Connect everything!
AddAnimationExtensions(Scene, Bone);
