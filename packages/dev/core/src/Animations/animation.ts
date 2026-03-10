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
