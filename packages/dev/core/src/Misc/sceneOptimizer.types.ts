export {};

declare module "./sceneOptimizer.pure" {
    namespace SceneOptimizerOptions {
        export { SceneOptimizerOptionsLowDegradationAllowed as LowDegradationAllowed };
        export { SceneOptimizerOptionsModerateDegradationAllowed as ModerateDegradationAllowed };
        export { SceneOptimizerOptionsHighDegradationAllowed as HighDegradationAllowed };
    }

    namespace SceneOptimizer {
        export { SceneOptimizerOptimizeAsync as OptimizeAsync };
    }
}
