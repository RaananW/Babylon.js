import { FrameGraphCascadedShadowGeneratorTask, FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator } from "./csmShadowGeneratorTask.pure";

declare module "./csmShadowGeneratorTask.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FrameGraphCascadedShadowGeneratorTask {
        export { FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator as IsCascadedShadowGenerator };
    }
}

FrameGraphCascadedShadowGeneratorTask.IsCascadedShadowGenerator = FrameGraphCascadedShadowGeneratorTaskIsCascadedShadowGenerator;

export * from "./csmShadowGeneratorTask.pure";
