import { FrameGraphTextureManager, FrameGraphTextureManagerCloneTextureOptions } from "./frameGraphTextureManager.pure";

declare module "./frameGraphTextureManager.pure" {
    namespace FrameGraphTextureManager {
        export { FrameGraphTextureManagerCloneTextureOptions as CloneTextureOptions };
    }
}

FrameGraphTextureManager.CloneTextureOptions = FrameGraphTextureManagerCloneTextureOptions;

export * from "./frameGraphTextureManager.pure";
