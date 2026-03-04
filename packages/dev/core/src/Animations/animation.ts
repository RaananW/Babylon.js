/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import animation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./animation.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Node } from "../node";
import { AnimationRange } from "./animationRange";
import {
    Animation,
    Animation_PrepareAnimation,
    AnimationCreateAnimation,
    AnimationCreateAndStartAnimation,
    AnimationCreateAndStartHierarchyAnimation,
    AnimationCreateMergeAndStartAnimation,
    AnimationTransitionTo,
    Animation_UniversalLerp,
    AnimationParse,
    AnimationAppendSerializedAnimations,
} from "./animation.pure";

declare module "./animation" {
    namespace Animation {
        export let _PrepareAnimation: typeof Animation_PrepareAnimation;
        export let CreateAnimation: typeof AnimationCreateAnimation;
        export let CreateAndStartAnimation: typeof AnimationCreateAndStartAnimation;
        export let CreateAndStartHierarchyAnimation: typeof AnimationCreateAndStartHierarchyAnimation;
        export let CreateMergeAndStartAnimation: typeof AnimationCreateMergeAndStartAnimation;
        export let TransitionTo: typeof AnimationTransitionTo;
        export let _UniversalLerp: typeof Animation_UniversalLerp;
        export let Parse: typeof AnimationParse;
        export let AppendSerializedAnimations: typeof AnimationAppendSerializedAnimations;
    }
}

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
