import {
    SceneOptimizerOptionsLowDegradationAllowed,
    SceneOptimizerOptionsModerateDegradationAllowed,
    SceneOptimizerOptionsHighDegradationAllowed,
    SceneOptimizerOptimizeAsync,
    SceneOptimizerOptions,
    SceneOptimizer,
} from "./sceneOptimizer.pure";

declare module "./sceneOptimizer.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace SceneOptimizerOptions {
        export { SceneOptimizerOptionsLowDegradationAllowed as LowDegradationAllowed };
        export { SceneOptimizerOptionsModerateDegradationAllowed as ModerateDegradationAllowed };
        export { SceneOptimizerOptionsHighDegradationAllowed as HighDegradationAllowed };
    }
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace SceneOptimizer {
        export { SceneOptimizerOptimizeAsync as OptimizeAsync };
    }
}

SceneOptimizerOptions.LowDegradationAllowed = SceneOptimizerOptionsLowDegradationAllowed;
SceneOptimizerOptions.ModerateDegradationAllowed = SceneOptimizerOptionsModerateDegradationAllowed;
SceneOptimizerOptions.HighDegradationAllowed = SceneOptimizerOptionsHighDegradationAllowed;
SceneOptimizer.OptimizeAsync = SceneOptimizerOptimizeAsync;

export * from "./sceneOptimizer.pure";
