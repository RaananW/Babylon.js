import { FrameGraphCascadedShadowGeneratorTask, FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator } from "./csmShadowGeneratorTask.pure";

declare module "./csmShadowGeneratorTask.pure" {
    namespace FrameGraphCascadedShadowGeneratorTask {
        export { FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator as IsCascadedShadowGenerator };
    }
}

FrameGraphCascadedShadowGeneratorTask.IsCascadedShadowGenerator = FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator;

export * from "./csmShadowGeneratorTask.pure";
