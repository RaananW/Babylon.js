export {};

declare module "./animation.pure" {
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
