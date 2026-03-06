/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import animation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./animation.pure";

import {
    Animation,
    AnimationAppendSerializedAnimations,
    AnimationCreateAndStartAnimation,
    AnimationCreateAndStartHierarchyAnimation,
    AnimationCreateAnimation,
    AnimationCreateMergeAndStartAnimation,
    AnimationParse,
    AnimationTransitionTo,
    Animation_PrepareAnimation,
    Animation_UniversalLerp,
} from "./animation.pure";
import { AnimationRange } from "./animationRange";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";

Animation._PrepareAnimation = Animation_PrepareAnimation;

Animation.CreateAnimation = AnimationCreateAnimation;

Animation.CreateAndStartAnimation = AnimationCreateAndStartAnimation;

Animation.CreateAndStartHierarchyAnimation = AnimationCreateAndStartHierarchyAnimation;

Animation.CreateMergeAndStartAnimation = AnimationCreateMergeAndStartAnimation;

Animation.TransitionTo = AnimationTransitionTo;

Animation._UniversalLerp = Animation_UniversalLerp;

Animation.Parse = AnimationParse;

Animation.AppendSerializedAnimations = AnimationAppendSerializedAnimations;

RegisterClass("BABYLON.Animation", Animation);

Node._AnimationRangeFactory = (name: string, from: number, to: number) => new AnimationRange(name, from, to);
